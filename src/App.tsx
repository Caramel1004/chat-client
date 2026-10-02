import { useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router'
import { ChatListPage } from './pages/ChatListPage'
import { ChatRoomPage } from './pages/ChatRoomPage'
import type { Message } from './types/chat'

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])

  function sendMessage(roomId: string, text: string) {
    const content = text.trim()
    if (!content) return
    setMessages(previous => [...previous, {
      id: crypto.randomUUID(), roomId, text: content, sentAt: new Date().toISOString(),
    }])
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="h-20 shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link to="/" aria-label="Chat 홈" className="flex items-center gap-2.5 rounded-lg text-2xl font-bold tracking-tight">
            <img src="/favicon.svg" alt="" className="size-9" />
            <span>chat<span className="text-indigo-600">.</span></span>
          </Link>
          <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">Beta · 로컬 미리보기</span>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<ChatListPage messages={messages} />} />
        <Route path="/rooms/:roomId" element={<ChatRoomPage messages={messages} onSend={sendMessage} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
