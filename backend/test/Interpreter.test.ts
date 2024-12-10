import { Interpreter } from '../src/Interpreter';
import { Script, Procedure, Action } from '../src/type';
import { RuntimeError } from '../src/error';

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers(); // 恢复原生定时器
});

describe('A Simple Script', () => {
  let script: Script;
  let interpreter: Interpreter;
  let onSendMock: jest.Mock;
  let onExitMock: jest.Mock;
  let onRuntimeErrorMock: jest.Mock;
  const userId = 'test_user';

  beforeEach(() => {
    // 初始化脚本
    script = {
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
    // 初始化回调函数的mock
    onSendMock = jest.fn();
    onExitMock = jest.fn();
    onRuntimeErrorMock = jest.fn();
    // 监视方法

    // 初始化 Interpreter
    interpreter = new Interpreter(
      script,
      {
        onSend: onSendMock,
        onExit: onExitMock,
        onRuntimeError: onRuntimeErrorMock,
      },
      {},
      userId
    );
  });
  // 测试每个状态
  describe('full_proc', () => {
    beforeEach(() => {
      interpreter.start('full_proc');
    });
    test('init', () => {
      // 检查是否发送了初始化消息
      expect(onSendMock).toHaveBeenCalledWith('a init message', userId);
    });
    test('silence', () => {
      // 是否有一个 timer
      expect(interpreter.timers).toHaveLength(1);
      jest.advanceTimersByTime(10001); // 模拟10秒后。由于无法触发 setTimeout 0，增加了1毫秒
      // 转移到 proc_without_hear
      expect(interpreter.curProc.id).toBe('proc_without_hear');
    });
    test('hear a string', () => {
      interpreter.receive('a string');
      expect(onSendMock).toHaveBeenCalledWith('heard a string', userId);
      expect(onExitMock).toHaveBeenCalled();
    });
    test('hear a regex', () => {
      interpreter.receive('regex2');
      expect(onSendMock).toHaveBeenCalledWith('heard a regex', userId);
      expect(onExitMock).toHaveBeenCalled();
    });
    test('default', () => {
      interpreter.receive('unexpected');
      // 转移到 proc_without_init
      expect(interpreter.curProc.id).toBe('proc_without_init');
    });
  });

  describe('proc_without_hear', () => {
    beforeEach(() => {
      interpreter.start('proc_without_hear');
    });

    test('init', () => {
      // 检查是否发送了初始化消息
      expect(onSendMock).toHaveBeenCalledWith('another init message', userId);
      expect(onExitMock).toHaveBeenCalled();
    });
  });

  describe('proc_without_init', () => {
    beforeEach(() => {
      interpreter.start('proc_without_init');
    });

    test('hear another string', () => {
      interpreter.receive('another string');
      expect(onSendMock).toHaveBeenCalledWith('heard another string', userId);
      expect(onExitMock).toHaveBeenCalled();
    });

    test('default', () => {
      interpreter.receive('unexpected');
      expect(onSendMock).toHaveBeenCalledWith('default message', userId);
      // 转移到 full_proc
      expect(interpreter.curProc.id).toBe('full_proc');
    });

    test('silence', () => {
      expect(interpreter.timers).toHaveLength(2);
      jest.advanceTimersByTime(10001); // silence 10
      expect(onSendMock).not.toHaveBeenCalledWith('silence message', userId);
      expect(interpreter.curProc.id).toBe('proc_without_init'); // 没有转移

      jest.advanceTimersByTime(10001); // silence 20
      // 转移到 proc_without_hear
      expect(interpreter.curProc.id).toBe('proc_without_hear');
    });
  });

  // 测试完整转移流程
  describe('complete flow', () => {
    test('full_proc -> proc_without_init -> proc_without_hear', () => {
      expect(interpreter.isWorking).toBe(false);
      interpreter.start();
      expect(interpreter.isWorking).toBe(true);
      // 初始状态是否为 full_proc
      expect(interpreter.curProc.id).toBe('full_proc');
      expect(onSendMock).toHaveBeenCalledWith('a init message', userId);
      interpreter.receive('unknown pattern');
      // 转移到 proc_without_init
      expect(interpreter.curProc.id).toBe('proc_without_init');
      expect(interpreter.timers).toHaveLength(2);
      jest.advanceTimersByTime(10001); // silence 10
      expect(onSendMock).toHaveBeenCalledWith('silence message', userId);
      expect(onSendMock).toHaveBeenCalledTimes(2);
      jest.advanceTimersByTime(10001); // silence 20
      // 转移到 proc_without_hear
      expect(interpreter.curProc.id).toBe('proc_without_hear');
      expect(onSendMock).toHaveBeenCalledWith('another init message', userId);
      expect(onSendMock).toHaveBeenCalledTimes(3);
      expect(onExitMock).toHaveBeenCalled();
    });
  });
});
