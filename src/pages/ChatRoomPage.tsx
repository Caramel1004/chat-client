import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router'
import { MessageComposer } from '../components/MessageComposer'
import { rooms } from '../data/rooms'
import type { Message } from '../types/chat'

interface ChatRoomPageProps {
  messages: Message[]
  onSend: (roomId: string, text: string) => void
}

const timeFormat = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' })

export function ChatRoomPage({ messages, onSend }: ChatRoomPageProps) {
  const { roomId } = useParams()
  const room = rooms.find(item => item.id === roomId)
  const roomMessages = messages.filter(message => message.roomId === roomId)
  const board = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (board.current) board.current.scrollTop = board.current.scrollHeight
  }, [roomId, roomMessages.length])

  if (!room) {
    return (
      <main className="mx-auto w-full max-w-4xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold">채팅방을 찾을 수 없어요</h1>
        <p className="mt-3 text-slate-600">목록에서 채팅방을 다시 선택해 주세요.</p>
        <Link to="/" className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white">채팅 목록으로</Link>
      </main>
    )
  }

  return (
    <main className="mx-auto flex h-[calc(100dvh-5rem)] min-h-100 w-full max-w-4xl flex-col sm:px-6 sm:py-6">
      <section aria-labelledby="room-heading" className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white sm:rounded-2xl sm:border sm:border-slate-200">
        <header className="flex items-center gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <Link to="/" aria-label="채팅 목록으로" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-xl text-slate-600 hover:bg-slate-100">←</Link>
          <div className="min-w-0">
            <h1 id="room-heading" className="text-lg font-bold">{room.name}</h1>
            <p className="mt-0.5 text-xs text-slate-500">자유롭게 이야기를 나누는 공간</p>
          </div>
        </header>
        <p className="border-b border-indigo-100 bg-indigo-50 px-5 py-3 text-center text-xs leading-5 text-indigo-800">
          로컬 미리보기 · 다른 사용자와 연결되지 않습니다. 새로고침하면 대화가 사라집니다.
        </p>

        <div ref={board} role="log" aria-label="대화 내용" aria-live="polite" aria-relevant="additions" tabIndex={0}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/60 px-4 py-6 sm:px-6">
          {roomMessages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center py-10 text-center">
              <span aria-hidden="true" className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl text-indigo-600">#</span>
              <h2 className="text-lg font-semibold">라운지에 오신 것을 환영해요</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">아직 메시지가 없어요.<br />가벼운 인사로 대화를 시작해 보세요.</p>
            </div>
          ) : (
            <ol className="space-y-5">
              {roomMessages.map(message => (
                <li key={message.id} className="flex flex-col items-end gap-1.5">
                  <span className="text-xs font-medium text-slate-600">나</span>
                  <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3 text-sm leading-6 whitespace-pre-wrap text-white [overflow-wrap:anywhere]">{message.text}</p>
                  <time dateTime={message.sentAt} className="text-xs text-slate-500">{timeFormat.format(new Date(message.sentAt))}</time>
                </li>
              ))}
            </ol>
          )}
        </div>
        <MessageComposer key={room.id} onSend={text => onSend(room.id, text)} />
      </section>
    </main>
  )
}
