export interface Room {
  id: string
  name: string
  description: string
}

export interface Message {
  id: string
  roomId: string
  senderId: string
  text: string
  sentAt: string
}

export type ConnectionStatus = 'unconfigured' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export interface RoomConnection {
  send: (message: Message) => Promise<void>
  close: () => void
}

export type ConnectRoom = (roomId: string, callbacks: {
  onMessage: (message: Message) => void
  onStatus: (status: ConnectionStatus) => void
}) => RoomConnection
