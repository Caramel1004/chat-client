import { describe, expect, it } from 'vitest'
import { appendMessage, parseMessage } from './messages'

const message = {
  id: '09e70d46-7765-48dd-92b9-0dbeb907cfd0', roomId: 'lounge',
  senderId: 'f2ead94b-73a2-4155-aa4d-8d48b930320d', text: '안녕\n반가워요',
  sentAt: '2026-10-02T12:00:00.000Z',
}

describe('외부 채팅 메시지', () => {
  it('올바른 현재 방의 메시지만 수락한다', () => {
    expect(parseMessage(message, 'lounge')).toEqual(message)
    expect(parseMessage(message, 'other')).toBeNull()
    for (const invalid of [null, [], {}, { ...message, senderId: '' }, { ...message, id: 'bad' },
      { ...message, text: ' ' }, { ...message, text: '가'.repeat(2001) },
      { ...message, sentAt: 'invalid' }, { ...message, sentAt: 123 }]) {
      expect(parseMessage(invalid, 'lounge')).toBeNull()
    }
  })

  it('같은 메시지의 에코와 중복 수신을 한 번만 보여 준다', () => {
    const first = appendMessage([], message)
    expect(appendMessage(first, message)).toEqual([message])
  })

  it('긴 세션에서 메모리에 보관하는 메시지를 최근 500개로 제한한다', () => {
    const previous = Array.from({ length: 500 }, (_, i) => ({ ...message, id: String(i) }))
    const result = appendMessage(previous, message)
    expect(result).toHaveLength(500)
    expect(result[0].id).toBe('1')
    expect(result.at(-1)).toEqual(message)
  })
})
