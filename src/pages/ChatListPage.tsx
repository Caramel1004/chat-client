import { useState } from 'react'
import { Link } from 'react-router'
import { CreateRoomModal } from '../components/CreateRoomModal'
import type { Message, Room } from '../types/chat'

interface ChatListPageProps {
  rooms: Room[]
  messages: Message[]
  onCreateRoom: (details: Omit<Room, 'id'>) => void
}

export function ChatListPage({ rooms, messages, onCreateRoom }: ChatListPageProps) {
  const [creating, setCreating] = useState(false)
  const [createdRoom, setCreatedRoom] = useState('')

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
      <p className="mb-3 text-sm font-semibold text-indigo-700">작은 인사로 시작하는 대화</p>
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">채팅 목록</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">이야기를 나누고 싶은 채팅방에 들어가 보세요.</p>
        </div>
        <button type="button" onClick={() => { setCreatedRoom(''); setCreating(true) }}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
          <span aria-hidden="true" className="text-lg leading-none">+</span> 채팅방 만들기
        </button>
      </div>
      <p role="status" className="mt-4 text-sm text-indigo-700 [overflow-wrap:anywhere]">
        {createdRoom && `“${createdRoom}” 채팅방을 만들었습니다.`}
      </p>

      <section aria-labelledby="rooms-heading" className="mt-12">
        <div className="mb-4 flex items-center gap-2">
          <h2 id="rooms-heading" className="text-sm font-semibold text-slate-700">채팅방</h2>
          <span className="rounded-md bg-slate-200/70 px-1.5 py-0.5 text-xs font-semibold text-slate-600">{rooms.length}</span>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map(room => {
            const lastMessage = messages.filter(message => message.roomId === room.id).at(-1)
            return (
              <li key={room.id} className="min-w-0">
                <Link to={`/rooms/${room.id}`} className="group block rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30">
                  <div className="mb-6 flex items-center justify-between">
                    <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl font-medium text-indigo-600">#</span>
                    <span className="text-xs font-medium text-slate-500">미리보기</span>
                  </div>
                  <h3 className="text-lg font-bold [overflow-wrap:anywhere]">{room.name}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 break-keep text-slate-600 [overflow-wrap:anywhere]">{room.description || '새로운 대화를 시작해 보세요.'}</p>
                  <p className="mt-6 truncate border-t border-slate-100 pt-4 text-sm text-slate-600">
                    {lastMessage ? `나: ${lastMessage.text}` : '첫 번째 메시지를 남겨 보세요.'}
                  </p>
                  <span className="mt-5 flex items-center justify-between text-sm font-semibold text-indigo-700">입장하기 <span aria-hidden="true">→</span></span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <aside className="mt-10 max-w-2xl rounded-xl border border-slate-200/80 px-5 py-4 text-sm leading-6 text-slate-600">
        <p className="font-semibold text-slate-700">지금은 화면을 먼저 만나보세요.</p>
        <p className="mt-1">생성한 채팅방과 메시지는 이 브라우저에서만 보이며 새로고침하면 사라집니다. 다른 사용자와의 실시간 연결은 준비 중입니다.</p>
      </aside>
      {creating && <CreateRoomModal onClose={() => setCreating(false)} onCreate={details => {
        onCreateRoom(details)
        setCreatedRoom(details.name)
      }} />}
    </main>
  )
}
