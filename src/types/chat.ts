export interface Room {
  id: string
  name: string
  description: string
}

export interface Message {
  id: string
  roomId: string
  text: string
  sentAt: string
}
