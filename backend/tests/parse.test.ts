import { parse } from '../src/parse';
import { ParseError } from '../src/error';

test('empty text', () => {
  const f = () => parse('');
  expect(f).toThrow(new ParseError(1, 'No Procedure in script'));
});

test('unknown keyword', () => {
  const text = `proc main
      init
        exit
      wait 5`;
  const f = () => parse(text);
  expect(f).toThrow(new ParseError(4, 'Unknown keyword "wait"'));
});

describe('Lexical', () => {
  test('unclosed string', () => {
    const text = `proc main
      init
        speak "Hello
      exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(3, 'Unclosed string'));
  });
  test('unclosed regex', () => {
    const text = `proc main
      hear /any`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(2, 'Unclosed regular expression'));
  });

  test('comment', () => {
    const text = `# some comment
        proc main
          init
            #speak "Hello, world"
            exit # comment`;
    const result = parse(text);
    expect(result).toEqual({
      entryProcId: 'main',
      procs: {
        main: {
          lineIdx: 2,
          id: 'main',
          initEvent: {
            type: 'InitEvent',
            lineIdx: 3,
            actions: [{ lineIdx: 5, type: 'ExitAction' }],
            hasExitOrGoto: true,
          },
        },
      },
    });
  });
});

describe('PROC Statement', () => {
  test('duplicate definition of procedure', () => {
    const text = `proc main
        init
          speak "Hello, world"
          exit
      proc main`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(5, 'Duplicate definition of Procedure "main"'));
  });

  test('invalid procedure name', () => {
    const text = `proc 1proc_starts_with_a_number
        init
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(1, 'Porcedure name "1proc_starts_with_a_number" is invalid'));
  });

  test('missing parameter', () => {
    const text = `proc
        init
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(1, 'Missing parameter for PROC statement'));
  });

  test('too many parameters', () => {
    const text = `proc main extra`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(1, 'Too many parameters for PROC statement'));
  });
});

describe('INIT Statement', () => {
  test('duplicate definition of InitEvent', () => {
    const text = `proc main
        init
          exit
        init
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(5, 'Duplicate definition of InitEvent'));
  });

  test('too many parameters', () => {
    const text = `proc main
        init extra
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(2, 'Too many parameters for INIT statement'));
  });
});

describe('HEAR Statement', () => {
  test('hear regex', () => {
    const text = `proc main
          hear /^[0-9]+$/
            exit
          default
            exit
          silence 5
            exit`;
    const result = parse(text);
    expect(result).toEqual({
      entryProcId: 'main',
      procs: {
        main: {
          defaultEvent: {
            actions: [
              {
                lineIdx: 5,
                type: 'ExitAction',
              },
            ],
            hasExitOrGoto: true,
            lineIdx: 4,
            type: 'DefaultEvent',
          },
          hearEvents: [
            {
              actions: [
                {
                  lineIdx: 3,
                  type: 'ExitAction',
                },
              ],
              hasExitOrGoto: true,
              lineIdx: 2,
              pattern: /^[0-9]+$/,
              type: 'HearEvent',
            },
          ],
          id: 'main',
          lineIdx: 1,
          silenceEvents: [
            {
              actions: [
                {
                  lineIdx: 7,
                  type: 'ExitAction',
                },
              ],
              hasExitOrGoto: true,
              lineIdx: 6,
              timeout: 5,
              type: 'SilenceEvent',
            },
          ],
        },
      },
    });
  });

  test('invalid parameter', () => {
    const text = `proc main
        hear 12345
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(2, 'Invalid parameter for HEAR statement'));
  });

  test('missing parameter', () => {
    const text = `proc main
        hear
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(3, 'Missing parameter for HEAR statement'));
  });

  test('too many parameters', () => {
    const text = `proc main
        hear "something" extra
        exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(2, 'Too many parameters for HEAR statement'));
  });
});

describe('DEFAULT Statement', () => {
  test('duplicate definition of DefaultEvent', () => {
    const text = `proc main
        init
          exit
        default
          exit
        default
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(7, 'Duplicate definition of DefaultEvent'));
  });

  test('too many parameters', () => {
    const text = `proc main
        init
          exit
        default extra
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(4, 'Too many parameters for DEFAULT statement'));
  });
});

describe('SILENCE Statement', () => {
  test('invalid parameter', () => {
    const text = `proc main
        init
          exit
        silence "5"
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(4, 'Invalid parameter for SILENCE statement'));
  });

  test('missing parameter', () => {
    const text = `proc main
        silence
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(3, 'Missing parameter for SILENCE statement'));
  });

  test('too many parameters', () => {
    const text = `proc main
        silence 5 extra
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(2, 'Too many parameters for SILENCE statement'));
  });
});

describe('SPEAK Statement', () => {
  test('invalid parameter', () => {
    const text = `proc main
        init
          speak 12345
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(3, 'Invalid parameter for SPEAK statement'));
  });

  test('missing parameter', () => {
    const text = `proc main
        init
          speak`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(3, 'Missing parameter for SPEAK statement'));
  });
});

describe('GOTO Statement', () => {
  test('undefined Procedure in goto statement', () => {
    const text = `proc main
          init
            goto unknownProcedure`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(2, 'Procedure "unknownProcedure" is not defined'));
  });

  test('invalid parameter', () => {
    const text = `proc main
        init
          goto 1proc`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(3, 'Invalid parameter for GOTO statement'));
  });

  test('missing parameter', () => {
    const text = `proc main
        init
          goto`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(3, 'Missing parameter for GOTO statement'));
  });

  test('too many parameters', () => {
    const text = `proc main
        init
          goto main extra`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(3, 'Too many parameters for GOTO statement'));
  });
});

describe('EXIT Statement', () => {
  test('too many parameters', () => {
    const text = `proc main
        init
          exit extra`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(3, 'Too many parameters for EXIT statement'));
  });
});

describe('Variable', () => {
  test('correct variable', () => {
    const text = `proc main
      init
        speak "Hello," $surname $sex
        exit`;
    const result = parse(text);
    expect(result).toEqual({
      entryProcId: 'main',
      procs: {
        main: {
          id: 'main',
          lineIdx: 1,
          initEvent: {
            type: 'InitEvent',
            lineIdx: 2,
            actions: [
              {
                lineIdx: 3,
                type: 'SpeakAction',
                tokens: [
                  { type: 'string', content: 'Hello,' },
                  { type: 'variable', content: 'surname' },
                  { type: 'variable', content: 'sex' },
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
    });
  });

  test('variable name with illegal characters', () => {
    const text = `proc main
      init
        speak "Hello," $us@er
      exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(3, 'Invalid parameter for SPEAK statement'));
  });
  test('variable name with digit at the beginning', () => {
    const text = `proc main
      init
        speak "Hello," $1u
      exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(3, 'Invalid parameter for SPEAK statement'));
  });
});

describe('Event Dependency', () => {
  test('missing InitEvent in Procedure with HearEvent', () => {
    const text = `proc main
        hear "hi"
          exit
        default
          exit
        silence 5
          exit`;
    const result = parse(text);
    expect(result).toEqual({
      entryProcId: 'main',
      procs: {
        main: {
          lineIdx: 1,
          id: 'main',
          hearEvents: [
            {
              type: 'HearEvent',
              lineIdx: 2,
              pattern: 'hi',
              actions: [{ lineIdx: 3, type: 'ExitAction' }],
              hasExitOrGoto: true,
            },
          ],
          defaultEvent: {
            type: 'DefaultEvent',
            lineIdx: 4,
            actions: [{ lineIdx: 5, type: 'ExitAction' }],
            hasExitOrGoto: true,
          },
          silenceEvents: [
            {
              type: 'SilenceEvent',
              lineIdx: 6,
              timeout: 5,
              actions: [{ lineIdx: 7, type: 'ExitAction' }],
              hasExitOrGoto: true,
            },
          ],
        },
      },
    });
  });

  test('missing InitEvent in Procedure without HearEvent', () => {
    const text = `proc main
        default
          exit`; // 没有hear，default多余
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(1, 'Procedure "main" has not defined InitEvent'));
  });

  test('HearEvent with DefaultEvent and SilenceEvent defined', () => {
    const text = `proc main
      init
        exit
      hear "something"
        exit
      default
        exit
      silence 5
        exit`;
    const result = parse(text);
    expect(result).toEqual({
      entryProcId: 'main',
      procs: {
        main: {
          lineIdx: 1,
          id: 'main',
          initEvent: {
            type: 'InitEvent',
            lineIdx: 2,
            actions: [{ lineIdx: 3, type: 'ExitAction' }],
            hasExitOrGoto: true,
          },
          hearEvents: [
            {
              type: 'HearEvent',
              lineIdx: 4,
              pattern: 'something',
              actions: [{ lineIdx: 5, type: 'ExitAction' }],
              hasExitOrGoto: true,
            },
          ],
          defaultEvent: {
            type: 'DefaultEvent',
            lineIdx: 6,
            actions: [{ lineIdx: 7, type: 'ExitAction' }],
            hasExitOrGoto: true,
          },
          silenceEvents: [
            {
              type: 'SilenceEvent',
              lineIdx: 8,
              timeout: 5,
              actions: [{ lineIdx: 9, type: 'ExitAction' }],
              hasExitOrGoto: true,
            },
          ],
        },
      },
    });
  });

  test('missing DefaultEvent when HearEvent is defined', () => {
    const text = `proc main
        init
          exit
        hear "something"
          exit
        silence 5
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(
      new ParseError(4, 'HearEvent does not have a corresponding DefaultEvent or SilenceEvent')
    );
  });

  test('missing SilenceEvent when HearEvent is defined', () => {
    const text = `proc main
        init
          exit
        hear "something"
          exit
        default
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(
      new ParseError(4, 'HearEvent does not have a corresponding DefaultEvent or SilenceEvent')
    );
  });
});

describe('Event Can Exit or Goto', () => {
  test('missing ExitAction or GotoAction in InitEvent', () => {
    const text = `proc main
        init
          speak "hi"`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(2, 'InitEvent has not defined ExitAction or GotoAction'));
  });
  test('missing ExitAction or GotoAction in HearEvent', () => {
    const text = `proc main
        init
          exit
        hear "hi"
          speak "hear"
        default
          exit
        silence 5
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(4, 'HearEvent has not defined ExitAction or GotoAction'));
  });
  test('missing ExitAction or GotoAction in DefaultEvent', () => {
    const text = `proc main
        init
          exit
        hear "hi"
          exit
        default
          speak "default"
        silence 5
          exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(6, 'DefaultEvent has not defined ExitAction or GotoAction'));
  });

  test('missing ExitAction or GotoAction in multiple SilenceEvent', () => {
    const text = `proc main
        init
          exit
        hear "hi"
          exit
        default
          exit
        silence 5
          speak "1"
        silence 10
          speak "2"`;
    const f = () => parse(text);
    expect(f).toThrow(
      new ParseError(8, 'At least one SilenceEvent must define ExitAction or GotoAction')
    );
  });

  test('GotoAction in multiple SilenceEvent', () => {
    const text = `proc main
      init
        exit
      hear "hi"
        exit
      default
        exit
      silence 5
        speak "1"
      silence 10
        goto main
      silence 20
        speak "3"`;
    const result = parse(text);
    expect(result).toEqual({
      entryProcId: 'main',
      procs: {
        main: {
          lineIdx: 1,
          id: 'main',
          initEvent: {
            type: 'InitEvent',
            lineIdx: 2,
            actions: [{ lineIdx: 3, type: 'ExitAction' }],
            hasExitOrGoto: true,
          },
          hearEvents: [
            {
              type: 'HearEvent',
              lineIdx: 4,
              pattern: 'hi',
              actions: [{ lineIdx: 5, type: 'ExitAction' }],
              hasExitOrGoto: true,
            },
          ],
          defaultEvent: {
            type: 'DefaultEvent',
            lineIdx: 6,
            actions: [{ lineIdx: 7, type: 'ExitAction' }],
            hasExitOrGoto: true,
          },
          silenceEvents: [
            {
              type: 'SilenceEvent',
              lineIdx: 8,
              timeout: 5,
              actions: [
                {
                  lineIdx: 9,
                  type: 'SpeakAction',
                  tokens: [{ type: 'string', content: '1' }],
                },
              ],
              hasExitOrGoto: false,
            },
            {
              type: 'SilenceEvent',
              lineIdx: 10,
              timeout: 10,
              actions: [{ lineIdx: 11, type: 'GotoAction', procId: 'main' }],
              hasExitOrGoto: true,
            },
            {
              type: 'SilenceEvent',
              lineIdx: 12,
              timeout: 20,
              actions: [
                {
                  lineIdx: 13,
                  type: 'SpeakAction',
                  tokens: [{ type: 'string', content: '3' }],
                },
              ],
              hasExitOrGoto: false,
            },
          ],
        },
      },
    });
  });
});

describe('No Procedure Defined Yet', () => {
  test('no procedure defined yet at INIT', () => {
    const text = `init
        exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(1, 'No Procedure defined yet'));
  });

  test('no procedure defined yet at HEAR', () => {
    const text = `hear "balance"
        exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(1, 'No Procedure defined yet'));
  });

  test('no procedure defined yet at DEFAULT', () => {
    const text = `default
        exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(1, 'No Procedure defined yet'));
  });

  test('no procedure defined yet at SILENCE', () => {
    const text = `silence 5
        exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(1, 'No Procedure defined yet'));
  });
});

describe('No Event Defined Yet', () => {
  test('first procedure no event defined yet', () => {
    const text = `proc main
        speak "hi"
        exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(2, 'No Event defined yet'));
  });
  test('following procedure no event defined yet', () => {
    const text = `proc main
        init
          exit
      proc next
        exit`;
    const f = () => parse(text);
    expect(f).toThrow(new ParseError(5, 'No Event defined yet'));
  });
});
