import { describe, expect, it } from 'vitest'
import { parseRealtimeFrame } from './realtimeApi'

describe('realtime SSE parser', () => {
  it('parses an authenticated chat event frame', () => {
    expect(parseRealtimeFrame([
      'id: 2026-08-18T08:00:00Z',
      'event: realtime',
      'data: {"type":"CHAT_MESSAGE","notificationId":null,"requestId":12,"contractorId":3,"messageId":44}',
    ].join('\n'))).toEqual({
      type: 'CHAT_MESSAGE',
      notificationId: null,
      requestId: 12,
      contractorId: 3,
      messageId: 44,
    })
  })

  it('supports CRLF and ignores malformed frames', () => {
    expect(parseRealtimeFrame('event: realtime\r\ndata: {"type":"NOTIFICATION_CHANGED","notificationId":7}\r\n'))
      .toMatchObject({ type: 'NOTIFICATION_CHANGED', notificationId: 7 })
    expect(parseRealtimeFrame('data: not-json')).toBeNull()
    expect(parseRealtimeFrame(': heartbeat')).toBeNull()
  })
})
