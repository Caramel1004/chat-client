import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { MessageComposer } from '../components/MessageComposer'
import { roomFromInvite, roomPath } from '../lib/roomLinks'
import type { ConnectRoom, ConnectionStatus, Message, Room, RoomConnection } from '../types/chat'

interface ChatRoomPageProps {
  rooms: Room[]
  messages: Message[]
  senderId: string
  connectRoom: ConnectRoom
  onReceive: (message: Message) => void
  onJoin: (room: Room) => void
}

const timeFormat = new Intl.DateTimeFormat('ko-KR', { hour: 'numeric', minute: '2-digit' })
const statusLabel: Record<ConnectionStatus, string> = {
  unconfigured: '실시간 채팅 연결 설정이 아직 완료되지 않았습니다.',
  connecting: '연결 중…', connected: '실시간 연결됨', reconnecting: '연결이 끊어져 다시 연결 중입니다.',
  error: '채팅에 연결하지 못했습니다. 연결 설정과 네트워크를 확인해 주세요.',
}

export function ChatRoomPage(props: ChatRoomPageProps) {
  const { roomId } = useParams()
  const { search } = useLocation()
  const invite = useMemo(() => roomFromInvite(roomId, search), [roomId, search])
  const room = props.rooms.find(item => item.id === roomId?.toLowerCase()) ?? invite
  if (!room) return (
    <main className="mx-auto w-full max-w-4xl px-5 py-20 text-center">
      <h1 className="text-2xl font-bold">채팅방을 찾을 수 없어요</h1>
      <p className="mt-3 text-slate-600">목록에서 선택하거나 전체 초대 링크로 입장해 주세요.</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white">채팅 목록으로</Link>
    </main>
  )
  return <RoomConversation key={room.id} {...props} room={room} />
}

function RoomConversation({ room, messages, senderId, connectRoom, onReceive, onJoin }: ChatRoomPageProps & { room: Room }) {
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [attempt, setAttempt] = useState(0)
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const connection = useRef<RoomConnection | null>(null)
  const board = useRef<HTMLDivElement>(null)
  const roomMessages = messages.filter(message => message.roomId === room.id)
  const newestMessageId = roomMessages.at(-1)?.id
  const inviteUrl = new URL(roomPath(room), window.location.origin).href

  useEffect(() => { onJoin(room) }, [room, onJoin])

  useEffect(() => {
    let active = true
    const current = connectRoom(room.id, {
      onMessage: message => { if (active) onReceive(message) },
      onStatus: value => { if (active) setStatus(value) },
    })
    connection.current = current
    return () => { active = false; connection.current = null; current.close() }
  }, [room.id, connectRoom, onReceive, attempt])

  useEffect(() => {
    if (board.current) board.current.scrollTop = board.current.scrollHeight
  }, [newestMessageId])

  async function send(text: string) {
    if (!connection.current || status !== 'connected') throw new Error('연결 대기 중입니다.')
    await connection.current.send({
      id: crypto.randomUUID(), roomId: room.id, senderId, text, sentAt: new Date().toISOString(),
    })
  }

  async function share() {
    try { await navigator.clipboard.writeText(inviteUrl); setShareState('copied') }
    catch { setShareState('manual') }
  }

  return (
    <main className="mx-auto flex h-[calc(100dvh-5rem)] min-h-120 w-full max-w-4xl flex-col sm:px-6 sm:py-6">
      <section aria-labelledby="room-heading" className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white sm:rounded-2xl sm:border sm:border-slate-200">
        <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
          <Link to="/" aria-label="채팅 목록으로" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-xl text-slate-600 hover:bg-slate-100">←</Link>
          <div className="min-w-0 flex-1">
            <h1 id="room-heading" className="text-lg font-bold [overflow-wrap:anywhere]">{room.name}</h1>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 [overflow-wrap:anywhere]">{room.description || '자유롭게 이야기를 나누는 공간'}</p>
          </div>
          <button onClick={() => { void share() }} type="button" className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            {shareState === 'copied' ? '링크 복사됨' : '초대 링크'}
          </button>
        </header>
        {shareState === 'manual' && <label className="px-5 py-2 text-xs text-slate-600">이 링크를 복사해 공유해 주세요.
          <input aria-label="초대 링크 주소" readOnly value={inviteUrl} onFocus={event => event.target.select()} className="mt-1 w-full rounded border border-slate-300 p-2" />
        </label>}
        <div className="border-b border-indigo-100 bg-indigo-50 px-5 py-3 text-center text-xs leading-5 text-indigo-800">
          <p role="status" className="font-semibold">{statusLabel[status]}</p>
          {(status === 'error' || status === 'reconnecting') && <button type="button" className="mt-1 rounded px-2 py-1 font-semibold underline" onClick={() => {
            setStatus('connecting'); setAttempt(value => value + 1)
          }}>다시 연결</button>}
          <p className="mt-1">공개 채팅 · 새로고침하면 대화가 사라집니다. 접속 전 대화는 불러오지 않습니다.</p>
        </div>
        <div ref={board} role="log" aria-label="대화 내용" aria-live="polite" aria-relevant="additions" tabIndex={0}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/60 px-4 py-6 sm:px-6">
          {roomMessages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center py-10 text-center">
              <span aria-hidden="true" className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-indigo-100 text-3xl text-indigo-600">#</span>
              <h2 className="max-w-full text-lg font-semibold [overflow-wrap:anywhere]">{room.name}에 오신 것을 환영해요</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">아직 메시지가 없어요.<br />초대 링크로 친구와 대화를 시작해 보세요.</p>
            </div>
          ) : (
            <ol className="space-y-5">
              {roomMessages.map(message => {
                const mine = message.senderId === senderId
                return <li key={message.id} className={`flex flex-col gap-1.5 ${mine ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs font-medium text-slate-600">{mine ? '나' : `게스트 ${message.senderId.slice(0, 4)}`}</span>
                  <p className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap [overflow-wrap:anywhere] ${mine ? 'rounded-tr-sm bg-indigo-600 text-white' : 'rounded-tl-sm border border-slate-200 bg-white text-slate-800'}`}>{message.text}</p>
                  <time dateTime={message.sentAt} className="text-xs text-slate-500">{timeFormat.format(new Date(message.sentAt))}</time>
                </li>
              })}
            </ol>
          )}
        </div>
        <MessageComposer onSend={send} disabled={status !== 'connected'} />
      </section>
    </main>
  )
}
