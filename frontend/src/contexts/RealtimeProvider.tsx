import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'

import { getUnreadNotificationCount } from '@/api/notificationApi'
import { consumeRealtimeEvents } from '@/api/realtimeApi'
import { getAccessToken } from '@/utils/authSession'
import { RealtimeContext, type SequencedRealtimeEvent } from './realtimeContext'

function wait(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timeoutId = window.setTimeout(resolve, milliseconds)
    signal.addEventListener('abort', () => {
      window.clearTimeout(timeoutId)
      resolve()
    }, { once: true })
  })
}

export default function RealtimeProvider({ children }: { children: ReactNode }) {
  useLocation()
  const accessToken = getAccessToken()
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [latestEvent, setLatestEvent] = useState<SequencedRealtimeEvent | null>(null)
  const sequenceRef = useRef(0)

  const refreshUnreadNotificationCount = useCallback(async () => {
    if (!getAccessToken()) {
      setUnreadNotificationCount(0)
      return
    }
    try {
      setUnreadNotificationCount(await getUnreadNotificationCount())
    } catch {
      // 재연결 중 일시적인 조회 실패가 기존의 정상 개수를 지우지 않게 둡니다.
    }
  }, [])

  useEffect(() => {
    if (!accessToken) {
      setUnreadNotificationCount(0)
      setLatestEvent(null)
      return
    }

    const controller = new AbortController()
    let retryDelay = 1_000
    void refreshUnreadNotificationCount()

    const connect = async () => {
      while (!controller.signal.aborted) {
        try {
          await consumeRealtimeEvents(controller.signal, (event) => {
            retryDelay = 1_000
            if (event.type === 'CONNECTED' || event.type === 'HEARTBEAT') return
            sequenceRef.current += 1
            setLatestEvent({ ...event, sequence: sequenceRef.current })
            if (event.type === 'NOTIFICATION_CHANGED') {
              void refreshUnreadNotificationCount()
            }
          })
        } catch {
          // 네트워크가 복구되면 아래 지수 백오프로 자동 재연결합니다.
        }

        if (controller.signal.aborted) break
        await wait(retryDelay, controller.signal)
        retryDelay = Math.min(retryDelay * 2, 15_000)
      }
    }

    void connect()
    return () => controller.abort()
  }, [accessToken, refreshUnreadNotificationCount])

  const value = useMemo(() => ({
    unreadNotificationCount,
    latestEvent,
    refreshUnreadNotificationCount,
  }), [latestEvent, refreshUnreadNotificationCount, unreadNotificationCount])

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}
