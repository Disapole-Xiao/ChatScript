import { Script, Procedure, Action, ProcId } from './type';
import { RuntimeError } from './error';

/**
 * 使用解释器需要提供的回调函数
 * @member onSend 在机器人客服有消息要发送给用户时调用
 * @member onExit 可选，在机器人客服主动关闭会话时调用
 * @member onError 可选，在发生错误时调用，默认使用 `console.error`
 * @param userId 可选，机器人客服会在调用上述方法时带上初始传入的 userId。没有传入则为 undefined
 */
export interface Config {
  onSend: (message: string, userId?: string) => void;
  onExit?: (userId?: string) => void;
  onError?: (error: Error, userId: string) => void;
}

export class Interpreter implements Config {
  script: Script;
  variables: Record<string, any>;
  curProc!: Procedure;
  timers: NodeJS.Timeout[] = [];
  isRunning: boolean = false; // 会话是否正在运行
  userId?: string;
  onSend: (message: string, userId?: string) => void;
  onExit: (userId?: string) => void;
  onError: (error: Error, userId?: string) => void;

  constructor(script: Script, config: Config, variables: Record<string, any>, userId?: string) {
    this.script = script;
    this.onSend = config.onSend;
    this.onExit = config.onExit || (() => {});
    this.onError = config.onError || console.error;
    this.variables = variables;
    this.userId = userId;
  }

  /**
   * 开始会话
   *
   * 如果对已经结束的会话调用该方法，会重新开始会话。
   *
   * 如果对正在进行的会话调用该方法，会抛出 RuntimeError
   *
   * @param fromProcId 可选，从指定的 Procedure 开始会话。默认从 `entryProcId` 开始
   */
  async start(fromProcId: ProcId = this.script.entryProcId) {
    try {
      if (this.isRunning) throw new Error('Interpreter is already running');

      // 如果会话已经结束，重新开始会话
      this.isRunning = true;
      this.timers = [];
      // 设置当前 Proc
      if (!this.script.procs[fromProcId]) {
        throw new RuntimeError(1, `Procedure "${fromProcId}" is not defined`);
      }
      this.curProc = this.script.procs[fromProcId];
      await this.execProc(this.curProc);
    } catch (error) {
      this.onError(error as Error, this.userId);
      this.end();
    }
  }

  /**
   * 接收用户的消息并执行相应的动作
   *
   * 等待用户消息。收到消息后根据消息内容继续执行
   * 对应 HearEvent 或 DefaultEvent 的时间序列
   *
   * @param message 接收到的消息
   */
  async receive(message: string) {
    try {
      if (!this.isRunning) throw new Error('Interpreter is not running');

      this.clearTimers(); // 收到消息后停止计时

      // 执行匹配的 hearEvent 对应的 Actions
      for (const hearEvent of this.curProc.hearEvents!) {
        if (
          (typeof hearEvent.pattern === 'string' && message.includes(hearEvent.pattern)) ||
          (hearEvent.pattern instanceof RegExp && hearEvent.pattern.test(message))
        ) {
          await this.execActions(hearEvent.actions);
          return;
        }
      }

      // 如果没有匹配，执行 defaultEvent 的 Events
      if (this.curProc.defaultEvent) {
        await this.execActions(this.curProc.defaultEvent!.actions);
      }
    } catch (error) {
      this.onError(error as Error, this.userId);
      this.end();
    }
  }

  end() {
    this.isRunning = false;
    this.clearTimers();
  }
  /**
   * 执行指定 Procedure
   *
   * 如果存在 InitEvent，执行对应事件序列。
   * 如果 InitEvent 存在 exit 或 goto 语句，
   * 执行完后结束当前 Procedure。
   *
   * 如果存在 SilenceEvents，设置定时器，
   * 在 `timeout` 秒后执行该 silenceEvent 对应的事件序列
   *
   * @param proc 要执行的 Procedure
   */
  private async execProc(proc: Procedure) {
    // 执行 initEvent
    if (proc.initEvent) {
      await this.execActions(proc.initEvent.actions);
      if (proc.initEvent.hasExitOrGoto) return; // 如果会退出，执行完之后返回
    }

    // 设置 silenceEvents 定时器
    if (proc.silenceEvents) {
      for (const silenceEvent of proc.silenceEvents) {
        const timer = setTimeout(() => {
          this.execActions(silenceEvent.actions);
        }, silenceEvent.timeout * 1000);
        this.timers.push(timer);
      }
    }
  }

  /**
   * 执行动作列表（某事件对应的动作）
   *
   * 执行完 exitAction 或 gotoAction 后，会立即停止执行后续动作。
   * gotoAction 会设置 `curProc` 为转移的 Procedure
   *
   * @param actions 要执行的动作列表
   */
  private async execActions(actions: Action[]) {
    try {
      for (const action of actions) {
        switch (action.type) {
          case 'SpeakAction':
            let message = '';
            for (const token of action.tokens) {
              if (token.type === 'string') {
                message += token.content;
              } else {
                // 如果是变量，在变量集中查找
                if (this.variables[token.content]) {
                  message += this.variables[token.content];
                } else {
                  throw new RuntimeError(
                    action.lineIdx,
                    `Varialble "${token.content}" does not exist`
                  );
                }
              }
            }
            this.onSend(message, this.userId); // 发送消息
            break;

          case 'GotoAction':
            const nextProc = this.script.procs[action.procId];
            if (!nextProc)
              throw new RuntimeError(action.lineIdx, `Procedure "${action.procId}" is not defined`);
            this.curProc = nextProc;
            await this.execProc(this.curProc); // 执行下一个 Proc
            return; // 停止执行后续动作

          case 'ExitAction':
            this.end(); // 结束会话
            this.onExit(this.userId);
            return; // 停止执行后续动作
        }
      }
    } catch (error) {
      this.onError(error as Error, this.userId);
      this.end();
    }
  }

  /**
   * 取消所有定时器并将 `timers` 列表清空
   */
  private clearTimers(): void {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers = [];
  }
}
