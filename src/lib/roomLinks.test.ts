import { describe, expect, it } from 'vitest'
import type { Room } from '../types/chat'
import { roomFromInvite, roomPath } from './roomLinks'

const roomId = '839a5698-40e2-40c5-987f-dba5b01e03f4'

describe('room invite links', () => {
  it('keeps the built-in lounge path free of invite metadata', () => {
    expect(roomPath({ id: 'lounge', name: '라운지', description: '기본 방' })).toBe('/rooms/lounge')
  })

  it('restores Korean text, punctuation and multiline metadata from a full invite URL', () => {
    const room: Room = { id: roomId, name: '개발 ? # & +\n모임', description: '첫 줄 + 질문?\n다음 # 이야기 & 답변' }
    const invite = new URL(roomPath(room), 'https://chat.example')

    expect(invite.pathname).toBe(`/rooms/${roomId}`)
    expect(invite.hash).toBe('')
    expect(roomFromInvite(invite.pathname.split('/').at(-1), invite.search)).toEqual(room)
  })

  it('normalizes uppercase UUIDs and trims metadata with an optional description', () => {
    expect(roomFromInvite(roomId.toUpperCase(), '?name=%20%20새%20모임%20%20')).toEqual({
      id: roomId, name: '새 모임', description: '',
    })
    expect(roomFromInvite(roomId, '?name=모임&description=%20%20설명%20%20')).toEqual({
      id: roomId, name: '모임', description: '설명',
    })
  })

  it('uses a canonical lowercase UUID in generated links', () => {
    expect(new URL(roomPath({ id: roomId.toUpperCase(), name: '모임', description: '' }), 'https://chat.example').pathname)
      .toBe(`/rooms/${roomId}`)
  })

  it.each([
    undefined, '', 'lounge', 'not-a-room', '../lounge', `${roomId}/other`, '839a5698-40e2-40c5-187f-dba5b01e03f4',
  ])('rejects invalid custom room IDs: %s', id => {
    expect(roomFromInvite(id, '?name=모임')).toBeNull()
  })

  it.each([
    '', '?description=설명', '?name=', '?name=%20%0A%20', '?name=첫째&name=둘째',
    '?name=모임&description=하나&description=둘', '?name=모임&source=a&source=b',
  ])('rejects missing, blank or duplicate metadata: %s', search => {
    expect(roomFromInvite(roomId, search)).toBeNull()
  })

  it('accepts the metadata limits after trimming and rejects excess text', () => {
    const name = '가'.repeat(40)
    const description = '나'.repeat(120)
    const search = new URLSearchParams({ name: ` ${name} `, description: ` ${description} ` }).toString()
    expect(roomFromInvite(roomId, search)).toEqual({ id: roomId, name, description })
    expect(roomFromInvite(roomId, new URLSearchParams({ name: `${name}가` }).toString())).toBeNull()
    expect(roomFromInvite(roomId, new URLSearchParams({ name, description: `${description}나` }).toString())).toBeNull()
  })
})
