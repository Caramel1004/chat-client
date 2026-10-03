import type { Room } from '../types/chat'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function roomPath(room: Room): string {
  if (room.id === 'lounge') return '/rooms/lounge'
  const search = new URLSearchParams({ name: room.name, description: room.description })
  return `/rooms/${encodeURIComponent(room.id.toLowerCase())}?${search.toString()}`
}

export function roomFromInvite(roomId: string | undefined, search: string): Room | null {
  if (!roomId || !uuidPattern.test(roomId)) return null

  const params = new URLSearchParams(search)
  const keys = [...params.keys()]
  if (new Set(keys).size !== keys.length) return null

  const name = params.get('name')?.trim()
  const description = params.get('description')?.trim() ?? ''
  if (!name || name.length > 40 || description.length > 120) return null

  return { id: roomId.toLowerCase(), name, description }
}
