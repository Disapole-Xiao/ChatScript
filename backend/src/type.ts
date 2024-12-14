/** 过程ID类型 */
export type ProcId = string;

/** 
 * 脚本对象，代表一个完整的对话脚本
 * @property {ProcId} entryProcId - 入口过程的ID
 * @property {Record<ProcId, Procedure>} procs - 所有过程
 */
export type Script = {
  entryProcId: ProcId;
  procs: Record<ProcId, Procedure>;
};

/**
 * 过程对象，代表一个对话过程
 * @property {number} lineIdx - 过程定义在源代码中的行号
 * @property {ProcId} id - 过程的唯一标识符
 * @property {InitEvent} [initEvent] - 初始化事件
 * @property {HearEvent[]} [hearEvents] - 听取用户消息的事件列表
 * @property {DefaultEvent} [defaultEvent] - 默认事件，当没有匹配的hear事件时触发
 * @property {SilenceEvent[]} [silenceEvents] - 沉默事件列表，当用户一定时间没有响应时触发
 */
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
  content: string; // 内容为字符串或者变量名（不包含 $ 符号）
};
