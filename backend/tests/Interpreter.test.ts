import { Interpreter } from '../src/Interpreter';
import { Script, Procedure, Action } from '../src/type';
import { RuntimeError } from '../src/error';
import { on } from 'events';
import exp from 'constants';

/**原脚本
 * ```
 * proc full_proc
      init
        speak "a init message"
      hear "a string"
        speak "heard a string"
        exit
      hear /regex1|regex2/
        speak "heard a regex"
        exit
      default
        goto proc_without_init
      silence 10
        goto proc_without_hear
    proc proc_without_hear
      init
        speak "another init message"
        exit
    proc proc_without_init
      hear "another string"
        speak "heard another string"
        exit
      default
        speak "default message"
        goto full_proc
      silence 10
        speak "silence message"
      silence 20
        goto proc_without_hear
    ```
  */
const exampleScript: Script = {
  entryProcId: 'full_proc',
  procs: {
    full_proc: {
      lineIdx: 1,
      id: 'full_proc',
      initEvent: {
        lineIdx: 2,
        type: 'InitEvent',
        actions: [
          {
            lineIdx: 3,
            type: 'SpeakAction',
            tokens: [
              {
                type: 'string',
                content: 'a init message',
              },
            ],
          },
        ],
        hasExitOrGoto: false,
      },
      hearEvents: [
        {
          lineIdx: 4,
          type: 'HearEvent',
          pattern: 'a string',
          actions: [
            {
              lineIdx: 5,
              type: 'SpeakAction',
              tokens: [
                {
                  type: 'string',
                  content: 'heard a string',
                },
              ],
            },
            {
              lineIdx: 6,
              type: 'ExitAction',
            },
          ],
          hasExitOrGoto: true,
        },
        {
          lineIdx: 7,
          type: 'HearEvent',
          pattern: /regex1|regex2/,
          actions: [
            {
              lineIdx: 8,
              type: 'SpeakAction',
              tokens: [
                {
                  type: 'string',
                  content: 'heard a regex',
                },
              ],
            },
            {
              lineIdx: 9,
              type: 'ExitAction',
            },
          ],
          hasExitOrGoto: true,
        },
      ],
      defaultEvent: {
        lineIdx: 10,
        type: 'DefaultEvent',
        actions: [
          {
            lineIdx: 11,
            type: 'GotoAction',
            procId: 'proc_without_init',
          },
        ],
        hasExitOrGoto: true,
      },
      silenceEvents: [
        {
          lineIdx: 12,
          type: 'SilenceEvent',
          timeout: 10,
          actions: [
            {
              lineIdx: 13,
              type: 'GotoAction',
              procId: 'proc_without_hear',
            },
          ],
          hasExitOrGoto: true,
        },
      ],
    },
    proc_without_hear: {
      lineIdx: 14,
      id: 'proc_without_hear',
      initEvent: {
        lineIdx: 15,
        type: 'InitEvent',
        actions: [
          {
            lineIdx: 16,
            type: 'SpeakAction',
            tokens: [
              {
                type: 'string',
                content: 'another init message',
              },
            ],
          },
          {
            lineIdx: 17,
            type: 'ExitAction',
          },
        ],
        hasExitOrGoto: true,
      },
    },
    proc_without_init: {
      lineIdx: 18,
      id: 'proc_without_init',
      hearEvents: [
        {
          lineIdx: 19,
          type: 'HearEvent',
          pattern: 'another string',
          actions: [
            {
              lineIdx: 20,
              type: 'SpeakAction',
              tokens: [
                {
                  type: 'string',
                  content: 'heard another string',
                },
              ],
            },
            {
              lineIdx: 21,
              type: 'ExitAction',
            },
          ],
          hasExitOrGoto: true,
        },
      ],
      defaultEvent: {
        lineIdx: 22,
        type: 'DefaultEvent',
        actions: [
          {
            lineIdx: 23,
            type: 'SpeakAction',
            tokens: [
              {
                type: 'string',
                content: 'default message',
              },
            ],
          },
          {
            lineIdx: 24,
            type: 'GotoAction',
            procId: 'full_proc',
          },
        ],
        hasExitOrGoto: true,
      },
      silenceEvents: [
        {
          lineIdx: 25,
          type: 'SilenceEvent',
          timeout: 10,
          actions: [
            {
              lineIdx: 26,
              type: 'SpeakAction',
              tokens: [
                {
                  type: 'string',
                  content: 'silence message',
                },
              ],
            },
          ],
          hasExitOrGoto: false,
        },
        {
          lineIdx: 27,
          type: 'SilenceEvent',
          timeout: 20,
          actions: [
            {
              lineIdx: 28,
              type: 'GotoAction',
              procId: 'proc_without_hear',
            },
          ],
          hasExitOrGoto: true,
        },
      ],
    },
  },
};
let onSendMock: jest.Mock;
let onExitMock: jest.Mock;
let onErrorMock: jest.Mock;
const userId = 'test_user';

// 便于创建 Interpreter 实例
function createInterpreter(script: Script, variables: Record<string, any> = {}) {
  return new Interpreter(
    script,
    {
      onSend: onSendMock,
      onExit: onExitMock,
      onError: onErrorMock,
    },
    variables,
    userId
  );
}

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers(); // 恢复原生定时器
});

beforeEach(() => {
  // 初始化回调函数的mock
  onSendMock = jest.fn();
  onExitMock = jest.fn();
  onErrorMock = jest.fn();
});

describe('An Example Script', () => {
  let interpreter: Interpreter;

  // 测试每个状态
  describe('full_proc', () => {
    beforeEach(async () => {
      interpreter = createInterpreter(exampleScript);
      await interpreter.start('full_proc');
    });
    test('init', () => {
      // 检查是否发送了初始化消息
      expect(onSendMock).toHaveBeenCalledWith('a init message', userId);
      expect(onSendMock).toHaveBeenCalledTimes(1);
    });
    test('silence', () => {
      // 是否有一个 timer
      expect(interpreter.timers).toHaveLength(1);
      jest.advanceTimersByTime(10000); // 模拟10秒后。
      // 转移到 proc_without_hear
      expect(interpreter.curProc.id).toBe('proc_without_hear');
    });
    test('hear a string', async () => {
      await interpreter.receive('a string');
      expect(onSendMock).toHaveBeenCalledWith('heard a string', userId);
      expect(onSendMock).toHaveBeenCalledTimes(2);
      expect(onExitMock).toHaveBeenCalled();
    });
    test('hear a regex', async () => {
      await interpreter.receive('regex2');
      expect(onSendMock).toHaveBeenCalledWith('heard a regex', userId);
      expect(onExitMock).toHaveBeenCalled();
    });
    test('default', async () => {
      await interpreter.receive('unexpected');
      // 转移到 proc_without_init
      expect(interpreter.curProc.id).toBe('proc_without_init');
    });
  });

  describe('proc_without_hear', () => {
    beforeEach(async () => {
      interpreter = createInterpreter(exampleScript);
      await interpreter.start('proc_without_hear');
    });

    test('init', () => {
      // 检查是否发送了初始化消息
      expect(onSendMock).toHaveBeenCalledWith('another init message', userId);
      expect(onExitMock).toHaveBeenCalled();
    });
  });

  describe('proc_without_init', () => {
    beforeEach(async () => {
      interpreter = createInterpreter(exampleScript);
      await interpreter.start('proc_without_init');
    });

    test('hear another string', async () => {
      await interpreter.receive('another string');
      expect(onSendMock).toHaveBeenCalledWith('heard another string', userId);
      expect(onExitMock).toHaveBeenCalled();
    });

    test('default', async () => {
      await interpreter.receive('unexpected');
      expect(onSendMock).toHaveBeenCalledWith('default message', userId);
      // 转移到 full_proc
      expect(interpreter.curProc.id).toBe('full_proc');
    });

    test('silence', async () => {
      expect(interpreter.timers).toHaveLength(2);
      await jest.advanceTimersByTimeAsync(10000); // silence 10
      expect(onSendMock).toHaveBeenCalledWith('silence message', userId);
      expect(interpreter.curProc.id).toBe('proc_without_init'); // 没有转移

      await jest.advanceTimersByTimeAsync(10000); // silence 20
      // 转移到 proc_without_hear
      expect(interpreter.curProc.id).toBe('proc_without_hear');
    });
  });

  // 测试完整转移流程
  describe('complete flow', () => {
    test('full_proc -> proc_without_init -> proc_without_hear', async () => {
      interpreter = createInterpreter(exampleScript);
      expect(interpreter.isRunning).toBe(false);
      await interpreter.start();
      expect(interpreter.isRunning).toBe(true);
      // 初始状态是否为 full_proc
      expect(interpreter.curProc.id).toBe('full_proc');
      expect(onSendMock).toHaveBeenCalledWith('a init message', userId);
      await interpreter.receive('unknown pattern');
      // 转移到 proc_without_init
      expect(interpreter.curProc.id).toBe('proc_without_init');
      expect(interpreter.timers).toHaveLength(2);
      jest.advanceTimersByTime(10000); // silence 10
      expect(onSendMock).toHaveBeenCalledWith('silence message', userId);
      expect(onSendMock).toHaveBeenCalledTimes(2);
      jest.advanceTimersByTime(10000); // silence 20
      // 转移到 proc_without_hear
      expect(interpreter.curProc.id).toBe('proc_without_hear');
      expect(onSendMock).toHaveBeenCalledWith('another init message', userId);
      expect(onSendMock).toHaveBeenCalledTimes(3);
      expect(onExitMock).toHaveBeenCalled();
    });
  });
});

// 模拟上游错误，传入脚本不规范（parse正确返回不会这样）
describe('Script Error', () => {
  test('undefined entryProcId', async () => {
    const script: Script = {
      entryProcId: 'undefined_proc_id',
      procs: {
        main: {
          lineIdx: 1,
          id: 'main',
          initEvent: {
            lineIdx: 2,
            type: 'InitEvent',
            actions: [
              {
                lineIdx: 3,
                type: 'SpeakAction',
                tokens: [
                  {
                    type: 'string',
                    content: 'this will not be sent',
                  },
                ],
              },
              {
                lineIdx: 4,
                type: 'ExitAction',
              },
            ],
            hasExitOrGoto: true,
          },
        },
      },
    };
    const interpreter = createInterpreter(script);
    await interpreter.start();
    expect(onSendMock).not.toHaveBeenCalled();
    expect(onExitMock).not.toHaveBeenCalled();
    expect(onErrorMock).toHaveBeenCalledWith(
      new RuntimeError(1, 'Procedure "undefined_proc_id" is not defined'),
      userId
    );
  });

  test('undefined goto procId', async () => {
    /** 原脚本
     *  ```
     *  proc main
     *    init
     *      goto undefined_proc_id
     *  ```
     */
    const script: Script = {
      entryProcId: 'main',
      procs: {
        main: {
          lineIdx: 1,
          id: 'main',
          initEvent: {
            lineIdx: 2,
            type: 'InitEvent',
            actions: [
              {
                lineIdx: 3,
                type: 'GotoAction',
                procId: 'undefined_proc_id',
              },
            ],
            hasExitOrGoto: true,
          },
        },
      },
    };
    const interpreter = createInterpreter(script);
    await interpreter.start();
    expect(onErrorMock).toHaveBeenCalledWith(
      new RuntimeError(3, 'Procedure "undefined_proc_id" is not defined'),
      userId
    );
  });
});

describe('Variable', () => {
  let script: Script;

  beforeEach(() => {
    /**原脚本
     * ```
     * proc main
       init
         speak "hello, " $user "!"
         exit
      ```
     */
    script = {
      entryProcId: 'main',
      procs: {
        main: {
          lineIdx: 1,
          id: 'main',
          initEvent: {
            lineIdx: 2,
            type: 'InitEvent',
            actions: [
              {
                lineIdx: 3,
                type: 'SpeakAction',
                tokens: [
                  {
                    type: 'string',
                    content: 'hello, ',
                  },
                  {
                    type: 'variable',
                    content: 'user',
                  },
                  {
                    type: 'string',
                    content: '!',
                  },
                ],
              },
              {
                lineIdx: 4,
                type: 'ExitAction',
              },
            ],
            hasExitOrGoto: true,
          },
        },
      },
    };
  });

  test('variable replacement', async () => {
    const interpreter = createInterpreter(script, { user: 'cookie' });
    await interpreter.start();
    expect(onSendMock).toHaveBeenCalledWith('hello, cookie!', userId);
    expect(onExitMock).toHaveBeenCalled();
  });

  test('undefined variable error', async () => {
    const interpreter = createInterpreter(script); // 没有定义 user
    await interpreter.start();
    expect(onErrorMock).toHaveBeenCalledWith(
      new RuntimeError(3, 'Variable "user" does not exist'),
      userId
    );
  });
});

// 调用 start / receive 时，Interpreter 状态不正确
describe('Unpropriate Call', () => {
  test('start when running', async () => {
    const interpreter = createInterpreter(exampleScript);
    await interpreter.start();
    await interpreter.start(); // 再次调用
    expect(onErrorMock).toHaveBeenCalledWith(new Error('Interpreter is already running'), userId);
  });

  test('receive when not running', async () => {
    const interpreter = createInterpreter(exampleScript);
    // 没有 start
    await interpreter.receive('any message');
    expect(onErrorMock).toHaveBeenCalledWith(new Error('Interpreter is not running'), userId);
  });
});

// 外部调用 end 方法，未完成的动作应中止
describe('External End', () => {
  test('end when running', async () => {
    const interpreter = createInterpreter(exampleScript);
    await interpreter.start();
    interpreter.end(); // 结束后不应该有其他动作发生
    await jest.advanceTimersByTimeAsync(10000); // 50 秒
    expect(onSendMock).toHaveBeenCalledTimes(1);
    expect(onExitMock).not.toHaveBeenCalled();
    expect(interpreter.isRunning).toBe(false);
  });
});

// 默认 config
describe('Default Config', () => {
  test('onExit and onError', async () => {
    const interpreter = new Interpreter(
      exampleScript,
      {
        onSend: onSendMock,
      },
      {},
      userId
    );
    expect(interpreter.onExit).toBeInstanceOf(Function);
    expect(interpreter.onError).toEqual(console.error);
  });
});
