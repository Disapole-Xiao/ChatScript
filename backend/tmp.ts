import { parse } from './src/parse';
import { Script } from './src/type';
import { Interpreter } from './src/Interpreter';
import { exampleTexts } from './examplesTexts';

console.log(
  JSON.stringify(
    parse(
      `proc main 
        init
          goto main # error
`
    ),
    null,
    2
  )
);

const res: Script = {
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
