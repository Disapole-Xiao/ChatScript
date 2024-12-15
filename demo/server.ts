import WebSocket from 'ws';
import { parse, Interpreter, Config } from 'chatscript';
import { users } from './userData';
import { exampleTexts } from './examplesTexts';

const testId = Number(process.argv[2]) || 0;
const text = exampleTexts[testId];

try {
  const script = parse(text);

  console.log(script);

  const port = 9999;
  const wss = new WebSocket.Server({ port: port });

  // 为每个连接的用户设置一个独立的聊天会话
  wss.on('connection', (ws, req) => {
    if (!req.url) throw new Error('req.url is undefined');
    // 获取 userId
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    if (!userId) throw new Error('userId is undefined');
    console.log(`User ${userId} connected`);

    const config: Config = {
      getVar: (varname: string) => getVariable(varname, userId),
      onSend: message => ws.send(message),
      onExit: () => {
        ws.send('--当前对话已结束--');
        ws.close();
      },
    };

    // 创建新的聊天实例
    const chat = new Interpreter(script!, config, userId);

    // 收到用户消息就发送给机器人
    ws.on('message', message => {
      chat.receive(message.toString('utf-8'));
    });

    // 连接关闭时的回调
    ws.on('close', () => {
      chat.end();
      console.log(`User ${userId} disconnected`);
    });

    chat.start();
  });

  console.log('WebSocket server running on ws://localhost:' + port);
} catch (e) {
  console.error(e);
}

function getVariable(varname: string, userId: string) {
  return users[testId][userId][varname];
}
