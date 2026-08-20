const EXPLICIT_TIME_ZONE_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/i
const API_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/

/**
 * The backend currently returns UTC LocalDateTime values without a zone suffix.
 * Add the missing UTC marker before converting so Date uses the browser's zone.
 */
export function parseApiDateTime(value?: string | null) {
  if (!value) return null

  const trimmed = value.trim()
  const normalized = API_DATE_TIME_PATTERN.test(trimmed) && !EXPLICIT_TIME_ZONE_PATTERN.test(trimmed)
    ? `${trimmed.replace(' ', 'T')}Z`
    : trimmed
  const parsed = new Date(normalized)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatBrowserTime(value?: string | null) {
  const date = parseApiDateTime(value)
  if (!date) return value ?? ''

  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatBrowserTime24(value?: string | null) {
  const date = parseApiDateTime(value)
  if (!date) return value ?? ''

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function formatBrowserMonthDayTime(value?: string | null) {
  const date = parseApiDateTime(value)
  if (!date) return value ?? ''

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}-${day} ${formatBrowserTime24(value)}`
}

export function formatBrowserDateTime(value?: string | null) {
  const date = parseApiDateTime(value)
  if (!date) return value ?? ''

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day} ${formatBrowserTime24(value)}`
}

export function formatBrowserKoreanDate(value?: string | null) {
  const date = parseApiDateTime(value)
  if (!date) return ''

  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

export function isSameBrowserDay(value: string | null | undefined, other = new Date()) {
  const date = parseApiDateTime(value)
  if (!date) return false

  return date.getFullYear() === other.getFullYear()
    && date.getMonth() === other.getMonth()
    && date.getDate() === other.getDate()
}
