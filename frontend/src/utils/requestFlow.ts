import { ACTIVE_REQUEST_ID_KEY } from '@/api/requestApi'
import type { RequestCreateInput } from '@/types/request'

const REQUEST_DRAFT_KEY = 'spaceup.requestDraft'

export function parseManwon(value: string): number | undefined {
  const normalized = value.replace(/[^0-9.]/g, '')
  if (!normalized) return undefined
  const amount = Number(normalized)
  return Number.isFinite(amount) ? Math.round(amount * 10_000) : undefined
}

export function saveRequestDraft(draft: RequestCreateInput) {
  sessionStorage.setItem(REQUEST_DRAFT_KEY, JSON.stringify(draft))
}

export function getRequestDraft(): RequestCreateInput | null {
  const stored = sessionStorage.getItem(REQUEST_DRAFT_KEY)
  if (!stored) return null
  try {
    const parsed = JSON.parse(stored) as Partial<RequestCreateInput>
    if (typeof parsed.region !== 'string' || typeof parsed.propertyType !== 'string') return null
    return parsed as RequestCreateInput
  } catch {
    return null
  }
}

export function setActiveRequestId(requestId: number) {
  sessionStorage.setItem(ACTIVE_REQUEST_ID_KEY, String(requestId))
}

export function getActiveRequestId(): number | null {
  const stored = sessionStorage.getItem(ACTIVE_REQUEST_ID_KEY)
  if (!stored || !/^\d+$/.test(stored)) return null
  const requestId = Number(stored)
  return Number.isSafeInteger(requestId) && requestId > 0 ? requestId : null
}

export function clearRequestFlow() {
  sessionStorage.removeItem(REQUEST_DRAFT_KEY)
  sessionStorage.removeItem(ACTIVE_REQUEST_ID_KEY)
}
