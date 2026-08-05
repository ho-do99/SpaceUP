import { API_BASE_URL } from '@/api/axiosInstance'

const imagePathPrefix = '/api/files/images/'

export function resolveApiAssetUrl(path: string) {
  const trimmedPath = path.trim()

  if (!trimmedPath) return null

  try {
    const apiBaseUrl = new URL(API_BASE_URL)
    const resolvedUrl = new URL(trimmedPath, `${apiBaseUrl.origin}/`)

    if (
      resolvedUrl.origin !== apiBaseUrl.origin ||
      !resolvedUrl.pathname.startsWith(imagePathPrefix)
    ) {
      return null
    }

    return resolvedUrl.toString()
  } catch {
    return null
  }
}
