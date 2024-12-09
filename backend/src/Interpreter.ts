import { Script, Procedure, Action } from './type';
import { RuntimeError } from './error';

/**
 * 使用解释器需要提供的回调函数
 * @member onSend 在机器人客服有消息要发送给用户时调用
 * @member onExit 可选，在机器人客服主动关闭会话时调用
 * @member onRuntimeError 可选，在发生 `RuntimeError` 错误时调用，默认使用 `console.error`
 */
export interface Config {
  onSend: (message: string) => void;
  onExit?: () => void;
  onRuntimeError?: (error: RuntimeError) => void;
}

export class Interpreter implements Config {
  readonly script: Script;
  readonly variables: Map<string, any>;
  private curProc!: Procedure;
  private timers: NodeJS.Timeout[] = [];
  private isWorking: boolean = true; // 会话是否正在运行
  private taskQueue: (() => void)[] = []; // 任务队列减少递归，每个任务是一个函数
  onSend: (message: string) => void;
  onExit: () => void;
  onRuntimeError: (error: RuntimeError) => void;

  constructor(script: Script, config: Config, variables: Map<string, any>) {
    this.script = script;
    this.onSend = config.onSend;
    this.onExit = config.onExit || (() => {});
    this.onRuntimeError = config.onRuntimeError || console.error;
    this.variables = variables;
  }

  /**
   * 开始会话
   * 如果对已经结束的会话调用该方法，会重新开始会话。
   */
  start() {
    try {
      if (this.isWorking) {
        // 如果会话已经结束，重新开始会话
        this.isWorking = false;
        this.timers = [];
        this.taskQueue = [];
        if (!this.script.procs.has(this.script.entryProcId)) {
          throw new RuntimeError(0, `Porcedure ${this.script.entryProcId} 未定义`);
        }
        this.curProc = this.script.procs.get(this.script.entryProcId)!;
        this.enqueueTask(() => this.execProc(this.curProc)); // 将初始Proc加入队列
        this.processQueue(); // 开始处理队列
      } else throw new Error('会话已经在运行');
    } catch (error) {
      if (error instanceof RuntimeError) {
        this.onRuntimeError(error);
      } else {
        throw error;
      }
    }
  }

  /**
   * 接收用户的消息并执行相应的动作
   * @param message 接收到的消息
   */
  receive(message: string): void {
    if (this.isWorking) throw new Error('会话未运行');
    console.debug('receive', message);
    this.clearTimers();

    // 将匹配的 hearEvent 对应的 Actions 加入任务队列
    for (const hearEvent of this.curProc.hearEvents || []) {
      if (
        (typeof hearEvent.pattern === 'string' && message.includes(hearEvent.pattern)) ||
        (hearEvent.pattern instanceof RegExp && hearEvent.pattern.test(message))
      ) {
        this.enqueueTask(() => this.execActions(hearEvent.actions));
        this.processQueue();
        return;
      }
    }

    // 如果没有匹配，加入 defaultEvent 的 Events
    if (this.curProc.defaultEvent) {
      this.enqueueTask(() => this.execActions(this.curProc.defaultEvent!.actions));
    }
    this.processQueue();
  }

  /**
   * 结束会话
   */
  end(): void {
    if (this.isWorking) return;
    this.clearTimers();
    this.isWorking = true;
  }
  /**
   * 添加任务到队列
   * @param task 无参数无返回值的函数
   */
  private enqueueTask(task: () => void) {
    this.taskQueue.push(task);
  }

  /**
   * 按顺序处理任务
   */
  private processQueue() {
    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (task) task(); // 执行任务
    }
  }

  /**
   * 执行指定 Procedure
   * 如果存在 initEvent，将对应事件集加入任务队列
   * 如果存在 silenceEvents，将定时器任务加入任务队列，定时器任务会在 `timeout` 秒后执行该 silenceEvent 对应的事件集
   * @param proc 要执行的 Procedure
   */
  private execProc(proc: Procedure): void {
    this.curProc = proc;
    console.debug('转移到' + proc.id);

    // 执行 initEvent
    if (proc.initEvent) {
      this.enqueueTask(() => this.execActions(proc.initEvent!.actions));
    }

    // 设置 silenceEvents 定时器
    if (proc.silenceEvents) {
      for (const silenceEvent of proc.silenceEvents) {
        this.enqueueTask(() => {
          const timer = setTimeout(() => {
            this.execActions(silenceEvent.actions);
          }, silenceEvent.timeout * 1000);
          this.timers.push(timer);
        });
      }
    }
  }

  /**
   * 执行动作列表（某事件对应的动作）
   * 执行完 exitAction 或 gotoAction 后，会立即停止执行后续动作。
   * gotoAction 会将下一个要执行的 Procedure 加入任务队列
   * @param actions 要执行的动作列表
   */
  private execActions(actions: Action[]): void {
    try {
      for (const action of actions) {
        switch (action.type) {
          case 'SpeakAction':
            console.debug('执行 speakAction');
            let message = '';
            for (const token of action.tokens) {
              if (token.type === 'string') {
                message += token.content;
              } else {
                if (this.variables.has(token.content)) {
                  message += this.variables.get(token.content);
                } else {
                  throw new RuntimeError(action.lineIdx, `变量 ${token.content} 不存在`);
                }
              }
            }
            this.onSend(message); // 发送消息
            break;

          case 'GotoAction':
            console.debug('执行 gotoAction')
            this.clearTimers();
            this.taskQueue = []; // 清空任务队列，不再执行当前 Proc 的后续 Event
            const nextProc = this.script.procs.get(action.procId);
            if (!nextProc)
              throw new RuntimeError(action.lineIdx, `Porcedure ${action.procId} 未定义`);
            this.enqueueTask(() => this.execProc(nextProc)); // 下一个过程加入队列
            setTimeout(() => this.processQueue(), 0);
            return; // 停止执行后续动作

          case 'ExitAction':
            console.debug('执行 exitAction');
            this.end();
            this.onExit();
            return; // 停止执行后续动作
        }
      }
    } catch (error) {
      if (error instanceof RuntimeError) {
        this.onRuntimeError(error);
        console.log('测试');
      } else {
        throw error;
      }
    }
  }

  /**
   * 取消所有定时器并将 timers 列表清空
   */
  private clearTimers(): void {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers = [];
  }
}
