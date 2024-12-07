"use client"
import * as React from "react"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar"
import { Button } from "@/src/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"

// 定义 WebSocket 地址
const SOCKET_URL = process.env.SOCKET_URL || 'ws://localhost:5555'; // 假设 WebSocket 服务器运行在 3000 端口

export default function Chat() {
  const [messages, setMessages] = React.useState([
    {
      role: "agent", // 初始消息，机器人欢迎信息
      content: "Hi, how can I help you today?",
    },
  ])
  const [input, setInput] = React.useState("") // 用户输入
  const inputLength = input.trim().length

  const [ws, setWs] = React.useState<WebSocket | null>(null) // WebSocket 实例

  // 初始化 WebSocket 连接
  React.useEffect(() => {
    const socket = new WebSocket(SOCKET_URL)
    
    socket.onopen = () => {
      console.log("Connected to WebSocket server")
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.role === "agent") {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: "agent",
            content: data.content,
          },
        ])
      }
    }

    socket.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    socket.onclose = () => {
      console.log("Disconnected from WebSocket server")
    }

    setWs(socket)

    // 清理 WebSocket 连接
    return () => {
      socket.close()
    }
  }, [])

  // 处理用户输入并发送到后端
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (inputLength === 0 || !ws) return

    // 添加用户输入到聊天记录
    setMessages([
      ...messages,
      {
        role: "user",
        content: input,
      },
    ])

    // 发送用户消息到 WebSocket 服务器
    ws.send(JSON.stringify({ role: "user", content: input }))

    // 清空输入框
    setInput("")
  }

  return (
    <Card className="h-full"> {/* Set Card height to 100% */}
      <CardHeader className="flex flex-row items-center">
        <div className="flex items-center space-x-4">
          <Avatar>
            <AvatarImage src="/avatars/robot-avatar.png" alt="Robot Avatar" />
            <AvatarFallback>R</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">Customer Support Bot</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)] overflow-y-auto"> {/* Ensure content area takes up most space */}
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {message.content}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="h-20">
        <form
          onSubmit={handleSubmit}
          className="flex w-full items-center space-x-2"
        >
          <Input
            id="message"
            placeholder="Type your message..."
            className="flex-1"
            autoComplete="off"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <Button type="submit" size="icon" disabled={inputLength === 0}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
