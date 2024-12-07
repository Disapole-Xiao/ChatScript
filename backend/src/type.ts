export type ProcId = string;

export type Script = {
  entryProcId: ProcId;
  procs: Map<ProcId, Procedure>;
};

export type Procedure = {
  lineIdx: number;
  id: ProcId;
  initEvent?: InitEvent;
  hearEvents?: HearEvent[];
  defaultEvent?: DefaultEvent;
  silenceEvents?: SilenceEvent[];
};

export type ProcEvent = InitEvent | HearEvent | SilenceEvent | DefaultEvent;
type EventCommon = {
  lineIdx: number;
  type: string;
  actions: Action[];
  hasExitOrGoto: boolean; // 该事件是否会终止或转移
};
type InitEvent = { type: 'initEvent' } & EventCommon;
type HearEvent = { type: 'hearEvent'; pattern: string | RegExp } & EventCommon;
type DefaultEvent = { type: 'defaultEvent' } & EventCommon;
type SilenceEvent = { type: 'silenceEvent'; timeout: number } & EventCommon;

export type Action = SpeakAction | GotoAction | ExitAction;
type SpeakAction = {
  lineIdx: number;
  type: 'speakAction';
  tokens: Token[];
};
type GotoAction = {
  lineIdx: number;
  type: 'gotoAction';
  procId: ProcId;
};
type ExitAction = {
  lineIdx: number;
  type: 'exitAction';
};

export type Token = {
  type: 'string' | 'variable';
  content: string; // 内容为字符串或者变量名
};
