"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = parse;
const error_1 = require("./error");
function parse(script) {
    let lineIdx = 0, procs = new Map(), // 所有proc
    entryProcId = null, curProc = null, // 当前 proc
    curEvent = null, // 当前 Event
    referedProcIds = [], // 记录下被引用的 Proc，检查是否存在
    errors = [];
    // 删除前后空白符
    let lines = script.split('\n').map(line => line.trim());
    // 解析每一行
    lines.forEach(line => parseLine(line));
    // 最后检查脚本整体
    checkScript();
    // 没有错误返回语法树，有错误只返回错误
    if (errors.length === 0)
        return {
            script: {
                entryProcId: entryProcId,
                procs: procs,
            },
            errors: []
        };
    else
        return {
            errors: errors,
        };
    function parseLine(line) {
        lineIdx++;
        if (line === '' || line.startsWith('#'))
            // 忽略空行和注释行
            return;
        let [command, arg] = /(\S+)\s*(.*)/.exec(line).slice(1); // 从和第一个空格分成两部分
        command = command.toLowerCase();
        arg = arg.trim();
        try {
            switch (command) {
                case 'proc':
                    processProc(arg);
                    break;
                case 'init':
                    processInit(arg);
                    break;
                case 'hear':
                    processHear(arg);
                    break;
                case 'default':
                    processDefault(arg);
                    break;
                case 'silence':
                    processSilence(arg);
                    break;
                case 'speak':
                    processSpeak(arg);
                    break;
                case 'goto':
                    processGoto(arg);
                    break;
                case 'exit':
                    processExit(arg);
                    break;
                default:
                    throw new error_1.ParseError(lineIdx, `未知语句: ${command}`);
            }
        }
        catch (e) {
            if (e instanceof error_1.ParseError) {
                errors.push(e);
                return;
            }
            console.error(e);
        }
    }
    function addActionToCurEvent(action) {
        if (!curEvent)
            throw new error_1.ParseError(lineIdx, '还没有定义 Event');
        curEvent.actions.push(action);
    }
    function processProc(arg) {
        const pattern = /^(\S+)$/;
        const result = pattern.exec(arg);
        if (!result) {
            throw new error_1.ParseError(lineIdx, 'proc 语句格式不正确');
        }
        const procId = result[1];
        if (procs.get(procId)) {
            throw new error_1.ParseError(lineIdx, `重复定义的 Procedure: ${procId}`);
        }
        const newProc = {
            lineIdx: lineIdx,
            id: procId,
        };
        if (procs.size === 0)
            entryProcId = procId;
        procs.set(procId, newProc);
        curProc = newProc; // 切换到当前 proc
        curEvent = null;
    }
    function processInit(arg) {
        try {
            if (arg !== '')
                throw new error_1.ParseError(lineIdx, 'init 后有多余字符');
            if (curProc) {
                if (curProc.initEvent)
                    throw new error_1.ParseError(lineIdx, '重复定义的 initEvent');
                curEvent = curProc.initEvent = {
                    lineIdx: lineIdx,
                    type: 'initEvent',
                    actions: [],
                    hasExitOrGoto: false,
                };
            }
            else
                throw new error_1.ParseError(lineIdx, '还没有定义 Procedure');
        }
        catch (e) {
            curEvent = null;
            throw e;
        }
    }
    function processHear(arg) {
        try {
            const regexPattern = /^\/(.*?)\/$/; // 匹配正则表达式或字符串
            const stringPattern = /^"(.*?)"$/;
            let result = regexPattern.exec(arg);
            let input;
            if (result) {
                // 匹配上正则表达式
                input = RegExp(result[1]);
            }
            else {
                result = stringPattern.exec(arg);
                if (result) {
                    // 匹配上字符串
                    input = result[1];
                }
                else {
                    // 都匹配不上
                    throw new error_1.ParseError(lineIdx, 'hear 语句参数不正确');
                }
            }
            if (curProc) {
                const newEvent = {
                    lineIdx: lineIdx,
                    type: 'hearEvent',
                    pattern: input,
                    actions: [],
                    hasExitOrGoto: false,
                };
                if (!curProc.hearEvents)
                    curProc.hearEvents = [];
                curProc.hearEvents.push(newEvent);
                curEvent = newEvent;
            }
            else {
                throw new error_1.ParseError(lineIdx, '还没有定义 Procedure');
            }
        }
        catch (e) {
            curEvent = null;
            throw e;
        }
    }
    function processDefault(arg) {
        try {
            if (arg !== '')
                throw new error_1.ParseError(lineIdx, 'default 后有多余字符');
            if (curProc) {
                if (curProc.defaultEvent)
                    throw new error_1.ParseError(lineIdx, '重复定义的 defaultEvent');
                curEvent = curProc.defaultEvent = {
                    lineIdx: lineIdx,
                    type: 'defaultEvent',
                    actions: [],
                    hasExitOrGoto: false,
                };
            }
            else {
                throw new error_1.ParseError(lineIdx, '还没有定义 Procedure');
            }
        }
        catch (e) {
            curEvent = null;
            throw e;
        }
    }
    function processSilence(arg) {
        try {
            const pattern = /^(\d+)$/;
            const result = pattern.exec(arg);
            if (!result) {
                throw new error_1.ParseError(lineIdx, 'silence 语句参数不正确');
            }
            if (curProc) {
                const newEvent = {
                    lineIdx: lineIdx,
                    type: 'silenceEvent',
                    timeout: parseInt(result[1]),
                    actions: [],
                    hasExitOrGoto: false,
                };
                if (!curProc.silenceEvents)
                    curProc.silenceEvents = [];
                curProc.silenceEvents.push(newEvent);
                curEvent = newEvent;
            }
            else {
                throw new error_1.ParseError(lineIdx, '还没有定义 Procedure');
            }
        }
        catch (e) {
            curEvent = null;
            throw e;
        }
    }
    function processSpeak(arg) {
        let tokens = [];
        let start = 0, end = 0, state = 'space';
        while (start < arg.length) {
            switch (state) {
                case 'space':
                    if (/\s/.test(arg[end]))
                        start++;
                    else if (arg[end] === '"')
                        state = 'string';
                    else if (arg[end] === '$')
                        state = 'variable';
                    else
                        throw new error_1.ParseError(lineIdx, 'speak 语句参数不正确');
                    end++;
                    break;
                case 'string':
                    while (arg[end] !== '"') {
                        end++;
                        if (end >= arg.length)
                            throw new error_1.ParseError(lineIdx, '未关闭的字符串');
                    }
                    tokens.push({
                        type: 'string',
                        content: arg.slice(start + 1, end),
                    });
                    end++;
                    start = end;
                    state = 'space';
                    break;
                case 'variable':
                    while (end < arg.length && arg[end] !== ' ') {
                        if (!/\w/.test(arg[end]))
                            throw new error_1.ParseError(lineIdx, '变量名只能包含字母、数字和下划线');
                        end++;
                    }
                    tokens.push({
                        type: 'variable',
                        content: arg.slice(start + 1, end),
                    });
                    start = end;
                    state = 'space';
                    break;
            }
        }
        addActionToCurEvent({
            lineIdx: lineIdx,
            type: 'speakAction',
            tokens: tokens,
        });
    }
    function processGoto(arg) {
        const pattern = /^\S+$/;
        const result = pattern.exec(arg);
        if (!result) {
            throw new error_1.ParseError(lineIdx, 'goto 语句参数不正确');
        }
        const procId = result[0];
        addActionToCurEvent({
            lineIdx: lineIdx,
            type: 'gotoAction',
            procId: procId,
        });
        referedProcIds.push({ line: lineIdx, procId: procId }); // 记录引用的 procId
        curEvent.hasExitOrGoto = true; // 标记当前 event 有结束语句
    }
    function processExit(arg) {
        if (arg !== '')
            throw new error_1.ParseError(lineIdx, 'exit 后有多余字符');
        addActionToCurEvent({
            lineIdx: lineIdx,
            type: 'exitAction',
        });
        curEvent.hasExitOrGoto = true; // 标记当前 event 有结束语句
    }
    /**
     * 检查一个 procedure 是否合法
     * @param proc 要检查的 Procedure
     */
    function checkProc(proc) {
        // 如果没有定义 hear，必须定义 init，且 init 能退出
        if (!proc.hearEvents) {
            if (!proc.initEvent) {
                errors.push(new error_1.ParseError(proc.lineIdx, 'Procedure 未定义 init'));
                return;
            }
            if (!proc.initEvent.hasExitOrGoto)
                errors.push(new error_1.ParseError(proc.initEvent.lineIdx, '未定义 exit 或 goto'));
        }
        else {
            // 如果定义了 hear，每个 hear 必须能结束
            for (let hearEvent of proc.hearEvents) {
                if (!hearEvent.hasExitOrGoto)
                    errors.push(new error_1.ParseError(hearEvent.lineIdx, '未定义 exit 或 goto'));
            }
            // 必须定义 default 和 silence
            if (!proc.defaultEvent || !proc.silenceEvents) {
                errors.push(new error_1.ParseError(proc.hearEvents[0].lineIdx, 'hear 没有对应的 default 或 silence'));
                return;
            }
            // default 必须能结束
            if (!proc.defaultEvent.hasExitOrGoto)
                errors.push(new error_1.ParseError(proc.defaultEvent.lineIdx, '未定义 exit 或 goto'));
            // silence 中至少有一个能结束
            if (proc.silenceEvents.every(e => !e.hasExitOrGoto))
                errors.push(new error_1.ParseError(proc.silenceEvents[0].lineIdx, '至少有一个 silence 要定义 exit 或 goto'));
        }
    }
    function checkScript() {
        // 检查是否有 proc 和 entryProcId
        if (procs.size === 0 || !entryProcId) {
            errors.push(new error_1.ParseError(0, '没有定义 Procedure'));
            return;
        }
        // 检查每一个 proc 是否合法
        for (let proc of procs.values()) {
            checkProc(proc);
        }
        // 检查是否存在未定义的 proc
        for (let { line, procId } of referedProcIds) {
            if (!procs.get(procId))
                errors.push(new error_1.ParseError(line, ` Procedure ${procId} 未定义`));
        }
    }
}
//# sourceMappingURL=parse.js.map