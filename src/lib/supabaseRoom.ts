import { createClient } from '@supabase/supabase-js'
import type { ConnectRoom } from '../types/chat'
import { parseMessage } from './messages'

function readConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !key || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return null
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) return null
    return { url: url.replace(/\/$/, ''), key }
  } catch {
    return null
  }
}

export const connectSupabaseRoom: ConnectRoom = (roomId, callbacks) => {
  const config = readConfig()
  if (!config) {
    callbacks.onStatus('unconfigured')
    return {
      async send() { throw new Error('Supabase 연결 설정이 필요합니다.') },
      close() {},
    }
  }

  const client = createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: { timeout: 10000 },
  })
  const channel = client.channel(`chat:${roomId}`, {
    config: { private: false, broadcast: { self: true, ack: true } },
  })
  let closed = false
  let subscribed = false
  let wasConnected = false

  callbacks.onStatus('connecting')
  channel.on('broadcast', { event: 'message' }, event => {
    if (closed) return
    const message = parseMessage(event.payload, roomId)
    if (message) callbacks.onMessage(message)
  }).subscribe(status => {
    if (closed) return
    subscribed = status === 'SUBSCRIBED'
    if (subscribed) {
      wasConnected = true
      callbacks.onStatus('connected')
    } else if (status === 'CLOSED') {
      callbacks.onStatus('error')
    } else {
      callbacks.onStatus(wasConnected ? 'reconnecting' : 'error')
    }
  })

  return {
    async send(message) {
      // send() falls back to HTTP if the socket cannot push; only allow live WebSocket sends.
      if (closed || !subscribed || channel.state !== 'joined' || !client.realtime.isConnected()) {
        throw new Error('채팅방에 연결되지 않았습니다.')
      }
      const valid = parseMessage(message, roomId)
      if (!valid) throw new Error('올바르지 않은 메시지입니다.')
      const result = await channel.send({ type: 'broadcast', event: 'message', payload: valid })
      if (result !== 'ok') throw new Error('메시지 전송을 확인하지 못했습니다.')
      if (!closed) callbacks.onMessage(valid)
    },
    close() {
      if (closed) return
      closed = true
      subscribed = false
      // This client belongs only to this room. Stop the socket immediately, even while leaving.
      void client.removeAllChannels().catch(() => {})
      void client.realtime.disconnect().catch(() => {})
    },
  }
}
