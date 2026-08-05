import axios, {
  AxiosHeaders,
  type AxiosRequestConfig,
  type AxiosResponse,
  type RawAxiosHeaders,
} from 'axios'
import { getAccessToken } from '@/utils/authSession'

const DEFAULT_API_BASE_URL = 'http://localhost:8080'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = (configuredApiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '')

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
})

export type ApiErrorKind =
  | 'business'
  | 'http'
  | 'network'
  | 'invalid-response'
  | 'canceled'

export class ApiClientError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null

  constructor(message: string, kind: ApiErrorKind, status: number | null = null) {
    super(message)
    this.name = 'ApiClientError'
    this.kind = kind
    this.status = status
  }
}

type ApiRequestConfig<Data> = Omit<AxiosRequestConfig<Data>, 'headers'> & {
  headers?: RawAxiosHeaders | AxiosHeaders
  authenticated?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getApiErrorMessage(value: unknown) {
  if (!isRecord(value) || value.success !== false || typeof value.message !== 'string') {
    return null
  }

  const message = value.message.trim()
  return message || null
}

export async function apiRequest<ResponseData, RequestData = unknown>({
  authenticated = false,
  headers,
  ...config
}: ApiRequestConfig<RequestData>): Promise<ResponseData> {
  const requestHeaders = AxiosHeaders.from(headers)
  const accessToken = authenticated ? getAccessToken() : null

  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  } else {
    requestHeaders.delete('Authorization')
  }

  try {
    const response = await axiosInstance.request<
      ResponseData,
      AxiosResponse<ResponseData>,
      RequestData
    >({
      ...config,
      headers: requestHeaders,
    })

    return response.data
  } catch (error: unknown) {
    if (axios.isCancel(error)) {
      throw new ApiClientError('요청이 취소되었습니다.', 'canceled')
    }

    if (!axios.isAxiosError(error)) {
      throw error
    }

    if (!error.response) {
      throw new ApiClientError('서버에 연결할 수 없습니다.', 'network')
    }

    const status = error.response.status
    const apiMessage = getApiErrorMessage(error.response.data)

    if (apiMessage) {
      throw new ApiClientError(apiMessage, 'business', status)
    }

    throw new ApiClientError('HTTP 요청에 실패했습니다.', 'http', status)
  }
}

export default axiosInstance
