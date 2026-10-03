import type { Message } from '../types/chat'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function parseMessage(value: unknown, roomId: string): Message | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const data = value as Record<string, unknown>
  if (data.roomId !== roomId || typeof data.id !== 'string' || !uuid.test(data.id)
    || typeof data.senderId !== 'string' || !uuid.test(data.senderId)
    || typeof data.text !== 'string' || !data.text.trim() || data.text.length > 2000
    || typeof data.sentAt !== 'string' || data.sentAt.length > 30
    || !Number.isFinite(Date.parse(data.sentAt))) return null
  return { id: data.id, roomId, senderId: data.senderId, text: data.text, sentAt: data.sentAt }
}

export function appendMessage(messages: Message[], message: Message): Message[] {
  if (messages.some(item => item.id === message.id && item.roomId === message.roomId)) return messages
  return [...messages, message].slice(-500)
}
