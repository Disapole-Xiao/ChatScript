"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const parse_1 = __importDefault(require("./parse"));
const ws_1 = __importDefault(require("ws"));
const interpreter_1 = require("./interpreter");
const userData_1 = require("./userData");
const scriptPath = process.argv[2] || './src/backend/example1.txt';
const text = fs.readFileSync(scriptPath, 'utf8');
const { script, errors } = (0, parse_1.default)(text);
if (errors.length > 0) {
    ParseErrorHandler(errors);
    process.exit(1);
}
console.log(script);
const port = Number(process.env.PORT) || 9999;
const wss = new ws_1.default.Server({ port: port });
// 为每个连接的用户设置一个独立的聊天会话
wss.on('connection', (ws, req) => {
    if (!req.url)
        throw new Error('req.url is undefined');
    // 获取 userId
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    if (!userId)
        throw new Error('userId is undefined');
    console.log(`User ${userId} connected`);
    const config = {
        onSend: message => ws.send(message),
        onExit: () => {
            ws.send('--当前对话已结束--');
            ws.close();
        },
    };
    const variables = new Map(Object.entries(userData_1.users[userId]));
    // 创建新的聊天实例
    const chat = new interpreter_1.Interpreter(script, config, variables); // TODO 补充回调
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
function ParseErrorHandler(errors) {
    for (let error of errors) {
        console.log(error.toString());
    }
}
//# sourceMappingURL=server.js.map