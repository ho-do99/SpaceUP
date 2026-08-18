import { createContext } from 'react'
import type { RealtimeEventPayload } from '@/api/realtimeApi'

export interface SequencedRealtimeEvent extends RealtimeEventPayload {
  sequence: number
}

export interface RealtimeContextValue {
  unreadNotificationCount: number
  latestEvent: SequencedRealtimeEvent | null
  refreshUnreadNotificationCount: () => Promise<void>
}

export const RealtimeContext = createContext<RealtimeContextValue>({
  unreadNotificationCount: 0,
  latestEvent: null,
  refreshUnreadNotificationCount: async () => undefined,
})
