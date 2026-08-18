import { API_BASE_URL } from './axiosInstance'
import { expireAuthSession, getAccessToken } from '@/utils/authSession'

export type RealtimeEventType =
  | 'CONNECTED'
  | 'HEARTBEAT'
  | 'NOTIFICATION_CHANGED'
  | 'CHAT_MESSAGE'

export interface RealtimeEventPayload {
  type: RealtimeEventType
  notificationId: number | null
  requestId: number | null
  contractorId: number | null
  messageId: number | null
}

function eventUrl() {
  return `${API_BASE_URL.replace(/\/$/, '')}/api/realtime/events`
}

export function parseRealtimeFrame(frame: string): RealtimeEventPayload | null {
  const data = frame
    .replace(/\r/g, '')
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')

  if (!data) return null

  try {
    const parsed = JSON.parse(data) as Partial<RealtimeEventPayload>
    return typeof parsed.type === 'string' ? parsed as RealtimeEventPayload : null
  } catch {
    return null
  }
}

export async function consumeRealtimeEvents(
  signal: AbortSignal,
  onEvent: (event: RealtimeEventPayload) => void,
) {
  const accessToken = getAccessToken()
  if (!accessToken) return

  const response = await fetch(eventUrl(), {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      Authorization: `Bearer ${accessToken}`,
      'Cache-Control': 'no-cache',
    },
    cache: 'no-store',
    signal,
  })

  if (response.status === 401) {
    expireAuthSession()
    return
  }
  if (!response.ok || !response.body) {
    throw new Error(`SSE connection failed: ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (!signal.aborted) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n')

    let boundary = buffer.indexOf('\n\n')
    while (boundary >= 0) {
      const payload = parseRealtimeFrame(buffer.slice(0, boundary))
      if (payload) onEvent(payload)
      buffer = buffer.slice(boundary + 2)
      boundary = buffer.indexOf('\n\n')
    }

    if (done) break
  }
}
