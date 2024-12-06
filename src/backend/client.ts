import WebSocket from 'ws';

const port = Number(process.env.PORT) || 9999;
const userId = process.argv[2] || 'u1';
console.log('userId:', userId);

// 连接到 WebSocket 服务器
const ws = new WebSocket(`ws://localhost:${port}/?userId=${userId}`);

ws.on('open', () => {
  console.log('Connected to the server');
  
  // 监听用户输入的命令
  process.stdin.on('data', (input) => {
    const message = input.toString().trim(); 
    ws.send(message);
  });
});

// 接收服务器响应并显示
ws.on('message', (data) => {
  console.log(`Bot: ${data}`);
});

ws.on('close', () => {
  console.log('Disconnected from the server');
  process.exit();
});
