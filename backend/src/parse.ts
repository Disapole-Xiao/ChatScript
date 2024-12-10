import { Script, Procedure, Action, ProcEvent, ProcId, Token } from './type';
import { ParseError } from './error';
import {exampleTexts} from '../examplesTexts';

export function parse(script: string): Script {
  let lineIdx: number = 0,
    procs: Record<ProcId, Procedure> = {}, // 所有proc
    entryProcId: ProcId | null = null,
    curProc: Procedure | null = null, // 当前 proc
    curEvent: ProcEvent | null = null, // 当前 Event
    referedProcIds: { line: number; procId: ProcId }[] = []; // 记录下被引用的 Proc，检查是否存在

  // 删除前后空白符
  let lines = script.split('\n').map(line => line.trim());
  // 解析每一行
  lines.forEach(line => parseLine(line));
  // 最后检查脚本整体
  checkScript();
  // 返回语法树
  return {
    entryProcId: entryProcId!,
    procs: procs,
  };

  function parseLine(line: string): void {
    lineIdx++;
    if (line === '' || line.startsWith('#'))
      // 忽略空行和注释行
      return;

    let [command, arg] = /(\S+)\s*(.*)/.exec(line)!.slice(1); // 从和第一个空格分成两部分
    command = command.toLowerCase();
    arg = arg.trim();
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
        throw new ParseError(lineIdx, `Unknown keyword "${command}"`);
    }
  }

  function addActionToCurEvent(action: Action): void {
    if (!curEvent) throw new ParseError(action.lineIdx, 'No Event defined yet');
    curEvent.actions.push(action);
  }

  function processProc(arg: string): void {
    const pattern = /^([a-zA-Z_]\w*)$/; // 字母或下划线开头，数字字母下划线构成
    const result = pattern.exec(arg);
    if (!result) {
      throw new ParseError(lineIdx, 'Incorrect parameter for PROC statement');
    }
    const procId = result[1];
    if (procs[procId]) {
      throw new ParseError(lineIdx, `Duplicate definition of Procedure "${procId}"`);
    }
    const newProc: Procedure = {
      lineIdx: lineIdx,
      id: procId,
    };
    if (Object.keys(procs).length === 0) entryProcId = procId;
    procs[procId] = newProc;
    curProc = newProc; // 切换到当前 proc
    curEvent = null;
  }

  function processInit(arg: string) {
    if (arg !== '')
      throw new ParseError(lineIdx, 'Extra characters after INIT statement');
    if (curProc) {
      if (curProc.initEvent)
        throw new ParseError(lineIdx, 'Duplicate definition of InitEvent');
      curEvent = curProc.initEvent = {
        lineIdx: lineIdx,
        type: 'InitEvent',
        actions: [],
        hasExitOrGoto: false,
      };
    } else throw new ParseError(lineIdx, 'No Procedure defined yet');
  }
  function processHear(arg: string): void {
    const regexPattern = /^\/(.*?)\/$/; // 匹配正则表达式或字符串
    const stringPattern = /^"(.*?)"$/;
    let result = regexPattern.exec(arg);
    let input: string | RegExp;
    if (result) {
      // 匹配上正则表达式
      input = RegExp(result[1]);
    } else {
      result = stringPattern.exec(arg);
      if (result) {
        // 匹配上字符串
        input = result[1];
      } else {
        // 都匹配不上
        throw new ParseError(lineIdx, 'Incorrect parameter for HEAR statement');
      }
    }
    if (curProc) {
      const newEvent: ProcEvent = {
        lineIdx: lineIdx,
        type: 'HearEvent',
        pattern: input,
        actions: [],
        hasExitOrGoto: false,
      };
      if (!curProc.hearEvents) curProc.hearEvents = [];
      curProc.hearEvents.push(newEvent);
      curEvent = newEvent;
    } else {
      throw new ParseError(lineIdx, 'No Procedure defined yet');
    }
  }

  function processDefault(arg: string): void {
    if (arg !== '')
      throw new ParseError(lineIdx, 'Extra characters after DEFAULT statement');
    if (curProc) {
      if (curProc.defaultEvent)
        throw new ParseError(lineIdx, 'Duplicate definition of DefaultEvent');
      curEvent = curProc.defaultEvent = {
        lineIdx: lineIdx,
        type: 'DefaultEvent',
        actions: [],
        hasExitOrGoto: false,
      };
    } else {
      throw new ParseError(lineIdx, 'No Procedure defined yet');
    }
  }

  function processSilence(arg: string): void {
    const pattern = /^(\d+)$/;
    const result = pattern.exec(arg);
    if (!result) {
      throw new ParseError(lineIdx, 'Incorrect parameter for SILENCE statement');
    }
    if (curProc) {
      const newEvent: ProcEvent = {
        lineIdx: lineIdx,
        type: 'SilenceEvent',
        timeout: parseInt(result[1]),
        actions: [],
        hasExitOrGoto: false,
      };
      if (!curProc.silenceEvents) curProc.silenceEvents = [];
      curProc.silenceEvents.push(newEvent);
      curEvent = newEvent;
    } else {
      throw new ParseError(lineIdx, 'No Procedure defined yet');
    }
  }

  function processSpeak(arg: string): void {
    let tokens: Token[] = [];
    let start = 0,
      end = 0,
      state = 'space';
    while (start < arg.length) {
      switch (state) {
        case 'space':
          if (/\s/.test(arg[end])) start++;
          else if (arg[end] === '"') state = 'string';
          else if (arg[end] === '$') state = 'variable';
          else throw new ParseError(lineIdx, 'Incorrect parameter for SPEAK statement');
          end++;
          break;
        case 'string':
          while (arg[end] !== '"') {
            end++;
            if (end >= arg.length) throw new ParseError(lineIdx, 'Unclosed string');
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
            if (!/\w/.test(arg[end]) || (end === start+1 && /[0-9]/.test(arg[end])))
              throw new ParseError(lineIdx, 'Invalid variable name');
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
      type: 'SpeakAction',
      tokens: tokens,
    });
  }

  function processGoto(arg: string): void {
    const pattern = /^\S+$/;
    const result = pattern.exec(arg);
    if (!result) {
      throw new ParseError(lineIdx, 'Incorrect parameter for GOTO statement');
    }
    const procId = result[0];
    addActionToCurEvent({
      lineIdx: lineIdx,
      type: 'GotoAction',
      procId: procId,
    });
    referedProcIds.push({ line: lineIdx, procId: procId }); // 记录引用的 procId
    curEvent!.hasExitOrGoto = true; // 标记当前 event 有结束语句
  }

  function processExit(arg: string): void {
    if (arg !== '')
      throw new ParseError(lineIdx, 'Extra characters after EXIT statement');
    addActionToCurEvent({
      lineIdx: lineIdx,
      type: 'ExitAction',
    });
    curEvent!.hasExitOrGoto = true; // 标记当前 event 有结束语句
  }
  /**
   * 检查一个 procedure 是否合法
   * @param proc 要检查的 Procedure
   */
  function checkProc(proc: Procedure) {
    // 如果没有定义 hear，必须定义 init，且 init 能退出
    if (!proc.hearEvents) {
      if (!proc.initEvent) {
        throw new ParseError(
          proc.lineIdx,
          `Procedure "${proc.id}" has not defined InitEvent`
        );
      }
      if (!proc.initEvent.hasExitOrGoto)
        throw new ParseError(
          proc.initEvent.lineIdx,
          'InitEvent has not defined ExitAction or GotoAction'
        );
    } else {
      // 如果定义了 hear，每个 hear 必须能结束
      for (let hearEvent of proc.hearEvents) {
        if (!hearEvent.hasExitOrGoto)
          throw new ParseError(
            hearEvent.lineIdx,
            'HearEvent has not defined ExitAction or GotoAction'
          );
      }
      // 必须定义 default 和 silence
      if (!proc.defaultEvent || !proc.silenceEvents) {
        throw new ParseError(
          proc.hearEvents[0].lineIdx,
          'HearEvent does not have a corresponding DefaultEvent or SilenceEvent'
        );
      }
      // default 必须能结束
      if (!proc.defaultEvent!.hasExitOrGoto)
        throw new ParseError(
          proc.defaultEvent!.lineIdx,
          'DefaultEvent has not defined ExitAction or GotoAction'
        );
      // silence 中至少有一个能结束
      if (proc.silenceEvents.every(e => !e.hasExitOrGoto))
        throw new ParseError(
          proc.silenceEvents[0].lineIdx,
          'At least one SilenceEvent must define ExitAction or GotoAction'
        );
    }
  }

  function checkScript() {
    // 检查是否有 proc 和 entryProcId
    if (Object.keys(procs).length === 0 || !entryProcId)
      throw new ParseError(1, `No Procedure in script`);
    // 检查每一个 proc 是否合法
    for (const proc of Object.values(procs)) {
      checkProc(proc);
    }
    // 检查是否存在未定义的 proc
    for (let { line, procId } of referedProcIds) {
      if (!procs[procId])
        throw new ParseError(line, `Procedure "${procId}" is not defined`);
    }
  }
}
