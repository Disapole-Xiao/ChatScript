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
type InitEvent = { type: 'InitEvent' } & EventCommon;
type HearEvent = { type: 'HearEvent'; pattern: string | RegExp } & EventCommon;
type DefaultEvent = { type: 'DefaultEvent' } & EventCommon;
type SilenceEvent = { type: 'SilenceEvent'; timeout: number } & EventCommon;

export type Action = SpeakAction | GotoAction | ExitAction;
type SpeakAction = {
  lineIdx: number;
  type: 'SpeakAction';
  tokens: Token[];
};
type GotoAction = {
  lineIdx: number;
  type: 'GotoAction';
  procId: ProcId;
};
type ExitAction = {
  lineIdx: number;
  type: 'ExitAction';
};

export type Token = {
  type: 'string' | 'variable';
  content: string; // 内容为字符串或者变量名
};
