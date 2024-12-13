import { Script, Procedure, Action, ProcEvent, ProcId, Token } from './type';
import { ParseError } from './error';
import { exampleTexts } from '../examplesTexts';

export function parse(script: string): Script {
  let lineIdx: number = 0,
    procs: Record<ProcId, Procedure> = {}, // 所有proc
    entryProcId: ProcId | null = null,
    curProc: Procedure | null = null, // 当前 proc
    curEvent: ProcEvent | null = null, // 当前 Event
    referedProcIds: { line: number; procId: ProcId }[] = []; // 记录下被引用的 Proc，检查是否存在

  const regexPattern = /^\/.*?\/$/, // 匹配正则表达式或字符串
    stringPattern = /^".*?"$/,
    numPattern = /^(\d+)$/,
    procIdPattern = /^[a-zA-Z_]\w*$/, // 字母或下划线开头，数字字母下划线构成
    varPattern = /^\$[a-zA-Z_]\w*$/; // $ + 字母或下划线开头，数字字母下划线构成

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

  /**
   * 将一行文本分割为单词块，并忽略行尾注释
   *
   * `"`和 `/` 包裹的字符串和正则表达式视为一个单词块
   *
   * @param line 一行
   * @returns 单词块数组
   * @example splitWords('some word "a string#" /a regex #/ # comment')
   * // => ['some', 'word', '"a string#"', '/a regex #/']
   */
  function splitWords(line: string): string[] {
    const words: string[] = [];
    let i = 0;
    const len = line.length;

    while (i < len) {
      let char = line[i];

      // 跳过空格
      if (char === ' ') {
        i++;
        continue;
      }

      // 处理注释 # 到行末
      if (char === '#') {
        break;
      }

      // 处理双引号中的单词
      if (char === '"') {
        let word = '';
        i++; // 跳过开头的双引号
        while (i < len && line[i] !== '"') {
          word += line[i];
          i++;
        }
        if (i >= len || line[i] !== '"') {
          throw new ParseError(lineIdx, 'Unclosed string');
        }
        words.push('"' + word + '"');
        i++; // 跳过结束的双引号
        continue;
      }

      // 处理正则表达式 / 到下一个 /
      if (char === '/') {
        let word = '';
        i++; // 跳过开头的 /
        while (i < len && line[i] !== '/') {
          word += line[i];
          i++;
        }
        if (i >= len || line[i] !== '/') {
          throw new ParseError(lineIdx, 'Unclosed regular expression');
        }
        words.push('/' + word + '/');
        i++; // 跳过结束的 /
        continue;
      }

      // 处理其他单词（以空格或特殊字符结束的）
      let word = '';
      while (i < len && line[i] !== ' ' && line[i] !== '"' && line[i] !== '/' && line[i] !== '#') {
        word += line[i];
        i++;
      }

      words.push(word);
    }

    return words;
  }
  function parseLine(line: string): void {
    lineIdx++;
    if (line === '' || line.startsWith('#'))
      // 忽略空行和注释行
      return;
    const words = splitWords(line);
    const command = words[0].toLowerCase();
    const args = words.slice(1);
    switch (command) {
      case 'proc':
        processProc(args);
        break;
      case 'init':
        processInit(args);
        break;
      case 'hear':
        processHear(args);
        break;
      case 'default':
        processDefault(args);
        break;
      case 'silence':
        processSilence(args);
        break;
      case 'speak':
        processSpeak(args);
        break;
      case 'goto':
        processGoto(args);
        break;
      case 'exit':
        processExit(args);
        break;
      default:
        throw new ParseError(lineIdx, `Unknown keyword "${command}"`);
    }
  }

  function addActionToCurEvent(action: Action): void {
    if (!curEvent) throw new ParseError(action.lineIdx, 'No Event defined yet');
    curEvent.actions.push(action);
  }

  function processProc(args: string[]): void {
    if (args.length < 1) throw new ParseError(lineIdx, 'Missing parameter for PROC statement');
    if (args.length > 1) throw new ParseError(lineIdx, 'Too many parameters for PROC statement');

    if (!procIdPattern.test(args[0]))
      throw new ParseError(lineIdx, `Porcedure name "${args[0]}" is invalid`);
    const procId = args[0];
    if (procs[procId])
      throw new ParseError(lineIdx, `Duplicate definition of Procedure "${procId}"`);

    const newProc: Procedure = {
      lineIdx: lineIdx,
      id: procId,
    };
    if (Object.keys(procs).length === 0) entryProcId = procId;
    procs[procId] = newProc;
    curProc = newProc; // 切换到当前 proc
    curEvent = null;
  }

  function processInit(args: string[]) {
    if (args.length > 0) throw new ParseError(lineIdx, 'Too many parameters for INIT statement');
    if (curProc) {
      if (curProc.initEvent) throw new ParseError(lineIdx, 'Duplicate definition of InitEvent');
      curEvent = curProc.initEvent = {
        lineIdx: lineIdx,
        type: 'InitEvent',
        actions: [],
        hasExitOrGoto: false,
      };
    } else throw new ParseError(lineIdx, 'No Procedure defined yet');
  }
  function processHear(args: string[]): void {
    if (args.length < 1) throw new ParseError(lineIdx, 'Missing parameter for HEAR statement');
    if (args.length > 1) throw new ParseError(lineIdx, 'Too many parameters for HEAR statement');

    let input: string | RegExp;
    if (regexPattern.test(args[0]))
      // 匹配上正则表达式
      input = RegExp(args[0].slice(1, -1));
    else if (stringPattern.test(args[0]))
      // 匹配上字符串
      input = args[0].slice(1, -1);
    // 都匹配不上
    else throw new ParseError(lineIdx, 'Invalid parameter for HEAR statement');

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

  function processDefault(args: string[]): void {
    if (args.length > 0) throw new ParseError(lineIdx, 'Too many parameters for DEFAULT statement');
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

  function processSilence(args: string[]): void {
    if (args.length < 1) throw new ParseError(lineIdx, 'Missing parameter for SILENCE statement');
    if (args.length > 1) throw new ParseError(lineIdx, 'Too many parameters for SILENCE statement');

    if (!numPattern.test(args[0]))
      throw new ParseError(lineIdx, 'Invalid parameter for SILENCE statement');

    if (curProc) {
      const newEvent: ProcEvent = {
        lineIdx: lineIdx,
        type: 'SilenceEvent',
        timeout: parseInt(args[0]),
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

  function processSpeak(args: string[]): void {
    if (args.length < 1) throw new ParseError(lineIdx, 'Missing parameter for SPEAK statement');

    let tokens: Token[] = [];
    for (let arg of args) {
      if (varPattern.test(arg))
        // 匹配变量
        tokens.push({
          type: 'variable',
          content: arg.slice(1),
        });
      else if (stringPattern.test(arg))
        // 匹配字符串
        tokens.push({
          type: 'string',
          content: arg.slice(1, -1),
        });
      else throw new ParseError(lineIdx, 'Invalid parameter for SPEAK statement');
    }

    addActionToCurEvent({
      lineIdx: lineIdx,
      type: 'SpeakAction',
      tokens: tokens,
    });
  }

  function processGoto(args: string[]): void {
    if (args.length < 1) throw new ParseError(lineIdx, 'Missing parameter for GOTO statement');
    if (args.length > 1) throw new ParseError(lineIdx, 'Too many parameters for GOTO statement');

    if (!procIdPattern.test(args[0]))
      throw new ParseError(lineIdx, 'Invalid parameter for GOTO statement');

    const procId = args[0];
    addActionToCurEvent({
      lineIdx: lineIdx,
      type: 'GotoAction',
      procId: procId,
    });
    referedProcIds.push({ line: lineIdx, procId: procId }); // 记录引用的 procId
    curEvent!.hasExitOrGoto = true; // 标记当前 event 有结束语句
  }

  function processExit(args: string[]): void {
    if (args.length > 0) throw new ParseError(lineIdx, 'Too many parameters for EXIT statement');
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
        throw new ParseError(proc.lineIdx, `Procedure "${proc.id}" has not defined InitEvent`);
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

  /**
   * 检查整个脚本是否合法
   */
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
      if (!procs[procId]) throw new ParseError(line, `Procedure "${procId}" is not defined`);
    }
  }
}
