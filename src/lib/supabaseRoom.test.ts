import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Message } from '../types/chat'
import { connectSupabaseRoom } from './supabaseRoom'

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient }))

function fakeClient() {
  let receive: (event: { payload: unknown }) => void = () => {}
  let subscribed: (status: string) => void = () => {}
  let connected = false
  const channel = {
    state: 'joining',
    on: vi.fn((_type: string, _filter: unknown, listener: typeof receive) => {
      receive = listener
      return channel
    }),
    subscribe: vi.fn((listener: typeof subscribed) => { subscribed = listener; return channel }),
    send: vi.fn<(...args: unknown[]) => Promise<string>>().mockResolvedValue('ok'),
  }
  const client = {
    channel: vi.fn(() => channel),
    realtime: { isConnected: () => connected, disconnect: vi.fn().mockResolvedValue(undefined) },
    removeAllChannels: vi.fn().mockResolvedValue(['ok']),
  }
  return {
    client, channel,
    receive: (payload: unknown) => receive({ payload }),
    setSocket: (value: boolean) => { connected = value },
    state: (status: string) => {
      connected = status === 'SUBSCRIBED'
      channel.state = connected ? 'joined' : 'errored'
      subscribed(status)
    },
  }
}

const message: Message = {
  id: 'f3a2f122-7539-4a7c-a35e-454effa75c05',
  senderId: '9248d95d-2283-4905-a44b-253a78f83f46',
  roomId: 'lounge', text: '안녕하세요', sentAt: '2026-10-03T00:00:00.000Z',
}

describe('Supabase Broadcast 연결', () => {
  let fake: ReturnType<typeof fakeClient>
  const onMessage = vi.fn()
  const onStatus = vi.fn()
  const connect = () => connectSupabaseRoom('lounge', { onMessage, onStatus })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test_key')
    fake = fakeClient()
    createClient.mockReturnValue(fake.client)
  })
  afterEach(() => vi.unstubAllEnvs())

  it.each(['', 'sb_secret_not_for_browser', 'eyJhbGciOiJIUzI1NiJ9.service_role.signature'])('공개 키가 없거나 잘못되면 연결/전송하지 않는다: %s', async key => {
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', key)
    const room = connect()
    expect(onStatus).toHaveBeenLastCalledWith('unconfigured')
    expect(createClient).not.toHaveBeenCalled()
    await expect(room.send(message)).rejects.toThrow()
    room.close()
  })

  it('잘못된 URL에서도 화면을 깨뜨리지 않고 설정 필요 상태를 반환한다', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'not-a-url')
    expect(() => connect()).not.toThrow()
    expect(onStatus).toHaveBeenLastCalledWith('unconfigured')
    expect(createClient).not.toHaveBeenCalled()
  })

  it('로그인 저장 없이 공개 Broadcast 채널에 self/ack 옵션으로 연결한다', () => {
    connect()
    expect(createClient).toHaveBeenCalledWith('https://example.supabase.co', 'sb_publishable_test_key', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      realtime: { timeout: 10000 },
    })
    expect(fake.client.channel).toHaveBeenCalledWith('chat:lounge', {
      config: { private: false, broadcast: { self: true, ack: true } },
    })
    expect(onStatus).toHaveBeenLastCalledWith('connecting')
  })

  it('구독과 실제 소켓 연결이 준비되기 전에는 HTTP fallback/오프라인 전송을 막는다', async () => {
    const room = connect()
    await expect(room.send(message)).rejects.toThrow()
    fake.state('SUBSCRIBED')
    expect(onStatus).toHaveBeenLastCalledWith('connected')
    fake.setSocket(false)
    await expect(room.send(message)).rejects.toThrow()
    fake.setSocket(true)
    fake.channel.state = 'joining'
    await expect(room.send(message)).rejects.toThrow()
    expect(fake.channel.send).not.toHaveBeenCalled()
  })

  it('채널 오류와 복구를 표시하며 수신 구독을 중복 등록하지 않는다', () => {
    connect()
    fake.state('CHANNEL_ERROR')
    expect(onStatus).toHaveBeenLastCalledWith('error')
    fake.state('SUBSCRIBED')
    fake.state('TIMED_OUT')
    expect(onStatus).toHaveBeenLastCalledWith('reconnecting')
    fake.state('SUBSCRIBED')
    expect(onStatus).toHaveBeenLastCalledWith('connected')
    fake.state('CLOSED')
    expect(onStatus).toHaveBeenLastCalledWith('error')
    expect(fake.channel.subscribe).toHaveBeenCalledOnce()
  })

  it('검증된 현재 방 메시지만 전달한다', () => {
    connect()
    fake.state('SUBSCRIBED')
    for (const invalid of [null, 'bad', { ...message, roomId: 'other' }, { ...message, text: ' ' }]) fake.receive(invalid)
    fake.receive(message)
    expect(onMessage).toHaveBeenCalledExactlyOnceWith(message)
  })

  it('서비스 수락 확인 후 자신의 메시지를 표시한다', async () => {
    const room = connect()
    fake.state('SUBSCRIBED')
    let resolve!: (value: string) => void
    fake.channel.send.mockReturnValueOnce(new Promise<string>(done => { resolve = done }))
    const pending = room.send(message)
    expect(fake.channel.send).toHaveBeenCalledWith({ type: 'broadcast', event: 'message', payload: message })
    expect(onMessage).not.toHaveBeenCalled()
    resolve('ok')
    await pending
    expect(onMessage).toHaveBeenCalledExactlyOnceWith(message)
    await expect(room.send({ ...message, roomId: 'other' })).rejects.toThrow()
    expect(fake.channel.send).toHaveBeenCalledOnce()
  })

  it.each(['error', 'timed out'])('실패 응답을 성공으로 처리하지 않는다: %s', async result => {
    const room = connect()
    fake.state('SUBSCRIBED')
    fake.channel.send.mockResolvedValueOnce(result)
    await expect(room.send(message)).rejects.toThrow()
    expect(onMessage).not.toHaveBeenCalled()
  })

  it('방을 떠나면 연결을 정리하고 늦은 메시지·ACK·상태 변경을 무시한다', async () => {
    const room = connect()
    fake.state('SUBSCRIBED')
    let resolve!: (value: string) => void
    fake.channel.send.mockReturnValueOnce(new Promise<string>(done => { resolve = done }))
    const pending = room.send(message)
    room.close()
    room.close()
    onStatus.mockClear()
    fake.receive(message)
    fake.state('SUBSCRIBED')
    resolve('ok')
    await pending
    expect(fake.client.removeAllChannels).toHaveBeenCalledOnce()
    expect(fake.client.realtime.disconnect).toHaveBeenCalledOnce()
    expect(onStatus).not.toHaveBeenCalled()
    expect(onMessage).not.toHaveBeenCalled()
    await expect(room.send(message)).rejects.toThrow()
  })
})
