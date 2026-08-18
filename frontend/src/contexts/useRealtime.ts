import { useContext } from 'react'
import { RealtimeContext } from './realtimeContext'

export default function useRealtime() {
  return useContext(RealtimeContext)
}
