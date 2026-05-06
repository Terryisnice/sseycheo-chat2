export type UserRole = 'user' | 'admin'

export type AppUser = {
  uid: string
  nickname: string
  role: UserRole
  isBlocked: boolean
  createdAt?: string
}

export type EventStatus = 'draft' | 'open' | 'in_progress' | 'completed'

export type ShuffleEvent = {
  id: string
  title: string
  status: EventStatus
  currentRound: number
  totalRounds: number
  roundMinutes: number
  roundEndsAt?: string
  participants: string[]
  createdBy: string
  createdAt?: string
}
