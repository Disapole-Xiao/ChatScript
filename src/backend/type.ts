export type ProcId = string;

export type Script = {
  procs: Map<ProcId, Procedure>;
  entryProcId: ProcId;
};

export type Procedure = {
  line: number;
  id: ProcId;
  initEvent?: InitEvent;
  hearEvents: HearEvent[];
  defaultEvent?: DefaultEvent;
  silenceEvents: SilenceEvent[];
};

export type ProcEvent = InitEvent | HearEvent | SilenceEvent | DefaultEvent;
type EventCommon = {
  line: number;
  type: string;
  actions: Action[];
  hasExitOrGoto: boolean; // 该事件是否会终止或转移
};
type InitEvent = { type: 'initEvent' } & EventCommon;
type HearEvent = { type: 'hearEvent'; input: string | RegExp } & EventCommon;
type DefaultEvent = { type: 'defaultEvent' } & EventCommon;
type SilenceEvent = { type: 'silenceEvent'; time: number } & EventCommon;

export type Action = SpeakAction | GotoAction | ExitAction;
type SpeakAction = {
  line: number;
  type: 'speakAction';
  tokens: Token[];
};
type GotoAction = {
  line: number;
  type: 'gotoAction';
  procId: ProcId;
};
type ExitAction = {
  line: number;
  type: 'exitAction';
};

export type Token = {
  type: 'string' | 'variable';
  content: string; // 内容为字符串或者变量名
};

export interface Runtime {
  userId: string;
  variables: Map<string, any>; // TODO
  curProc: Procedure;
}
