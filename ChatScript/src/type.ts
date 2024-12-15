/**
 * 定义了 ChatScript 脚本的结构和类型
 * @module
 */

/** 过程标识符类型 */
export type ProcId = string;

/**
 * 脚本对象，描述客服机器人逻辑
 * @property entryProcId - 入口过程 ID
 * @property procs - 脚本包含的所有过程
 * @interface
 */
export type Script = {
  entryProcId: ProcId;
  procs: Record<ProcId, Procedure>;
};

/**
 * 过程对象
 * @property lineIdx - 过程定义在源代码中的行号
 * @property id - 过程的唯一标识符
 * @property initEvent - 初始化事件
 * @property hearEvents - 听取用户消息的事件列表
 * @property defaultEvent - 默认事件，当没有匹配的hear事件时触发
 * @property silenceEvents - 沉默事件列表，当用户一定时间没有响应时触发
 * @interface
 */
export type Procedure = {
  lineIdx: number;
  id: ProcId;
  initEvent?: InitEvent;
  hearEvents?: HearEvent[];
  defaultEvent?: DefaultEvent;
  silenceEvents?: SilenceEvent[];
};

/** 事件类型 */
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

/** 动作类型 */
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

/**
 * SPEAK 语句参数类型
 */
export type Token = {
  type: 'string' | 'variable';
  content: string; // 内容为字符串或者变量名（不包含 $ 符号）
};
