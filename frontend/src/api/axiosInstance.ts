import axios, {
  AxiosHeaders,
  type AxiosRequestConfig,
  type AxiosResponse,
  type RawAxiosHeaders,
} from 'axios'
import { getAccessToken } from '@/utils/authSession'

/**
 * 2026-08-06 백엔드 API 명세 기준 주소
 *
 * 중요:
 * API 호출부에서 "/api/member/login"처럼
 * 이미 "/api"를 포함한 경로를 사용하므로
 * baseURL에는 "/api"를 붙이지 않습니다.
 */
const DEFAULT_API_BASE_URL = 'http://localhost:8090'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

/**
 * baseURL을 안전하게 정리합니다.
 *
 * 다음처럼 환경변수에 /api가 잘못 포함되어 있어도:
 * http://localhost:8090/api
 *
 * 실제 baseURL은 아래처럼 정리합니다.
 * http://localhost:8090
 *
 * 환경변수가 단순히 "/api"로 되어 있으면
 * 프론트 서버 5173으로 요청되는 문제가 생기므로
 * 기본 백엔드 주소 8090을 사용합니다.
 */
function resolveApiBaseUrl(value: string | undefined): string {
  const candidate = value?.trim()

  if (!candidate) {
    return DEFAULT_API_BASE_URL
  }

  const withoutTrailingSlash = candidate.replace(/\/+$/, '')

  if (
    withoutTrailingSlash === '/api' ||
    withoutTrailingSlash.toLowerCase() === 'api'
  ) {
    return DEFAULT_API_BASE_URL
  }

  const withoutApiSuffix = withoutTrailingSlash.replace(/\/api$/i, '')

  return withoutApiSuffix || DEFAULT_API_BASE_URL
}

export const API_BASE_URL = resolveApiBaseUrl(configuredApiBaseUrl)

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
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

  constructor(
    message: string,
    kind: ApiErrorKind,
    status: number | null = null,
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.kind = kind
    this.status = status
  }
}

type ApiRequestConfig<Data> = Omit<
  AxiosRequestConfig<Data>,
  'headers'
> & {
  headers?: RawAxiosHeaders | AxiosHeaders

  /**
   * true이면 sessionStorage의 accessToken을
   * Authorization: Bearer 토큰으로 전송합니다.
   *
   * 로그인, 회원가입 등의 공개 API는 false 또는 생략합니다.
   */
  authenticated?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function getApiErrorMessage(value: unknown): string | null {
  if (
    !isRecord(value) ||
    value.success !== false ||
    typeof value.message !== 'string'
  ) {
    return null
  }

  const message = value.message.trim()

  return message || null
}

/**
 * API 요청 경로를 정리합니다.
 *
 * 예:
 * api/member/login
 * → /api/member/login
 *
 * /api/api/member/login
 * → /api/member/login
 */
function normalizeRequestUrl(url: string | undefined): string | undefined {
  if (!url) {
    return url
  }

  /**
   * 완전한 외부 URL이면 수정하지 않습니다.
   */
  if (/^https?:\/\//i.test(url)) {
    return url
  }

  const normalized = `/${url.replace(/^\/+/, '')}`

  return normalized.replace(
    /^\/api\/api(?=\/|$)/i,
    '/api',
  )
}

export async function apiRequest<
  ResponseData,
  RequestData = unknown,
>({
  authenticated = false,
  headers,
  ...config
}: ApiRequestConfig<RequestData>): Promise<ResponseData> {
  const requestHeaders = AxiosHeaders.from(headers)
  const accessToken = authenticated ? getAccessToken() : null

  if (accessToken) {
    requestHeaders.set(
      'Authorization',
      `Bearer ${accessToken}`,
    )
  } else {
    /**
     * 로그인과 회원가입 같은 공개 API 요청에는
     * Authorization Header를 보내지 않습니다.
     */
    requestHeaders.delete('Authorization')
  }

  const normalizedUrl = normalizeRequestUrl(config.url)

  try {
    const response = await axiosInstance.request<
      ResponseData,
      AxiosResponse<ResponseData>,
      RequestData
    >({
      ...config,
      url: normalizedUrl,
      headers: requestHeaders,
    })

    return response.data
  } catch (error: unknown) {
    if (axios.isCancel(error)) {
      throw new ApiClientError(
        '요청이 취소되었습니다.',
        'canceled',
      )
    }

    if (!axios.isAxiosError(error)) {
      throw error
    }

    if (!error.response) {
      throw new ApiClientError(
        '서버에 연결할 수 없습니다.',
        'network',
      )
    }

    const status = error.response.status
    const apiMessage = getApiErrorMessage(error.response.data)

    if (apiMessage) {
      throw new ApiClientError(
        apiMessage,
        'business',
        status,
      )
    }

    if (status === 401) {
      throw new ApiClientError(
        '로그인이 필요하거나 아이디 또는 비밀번호가 올바르지 않습니다.',
        'http',
        status,
      )
    }

    if (status === 403) {
      throw new ApiClientError(
        '해당 기능에 접근할 권한이 없습니다.',
        'http',
        status,
      )
    }

    if (status === 404) {
      throw new ApiClientError(
        '요청한 정보를 찾을 수 없습니다.',
        'http',
        status,
      )
    }

    if (status === 409) {
      throw new ApiClientError(
        '현재 상태에서는 요청을 처리할 수 없습니다.',
        'http',
        status,
      )
    }

    if (status === 413) {
      throw new ApiClientError(
        '업로드할 수 있는 파일 크기를 초과했습니다.',
        'http',
        status,
      )
    }

    if (status >= 500) {
      throw new ApiClientError(
        '서버에서 요청을 처리하지 못했습니다.',
        'http',
        status,
      )
    }

    throw new ApiClientError(
      'HTTP 요청에 실패했습니다.',
      'http',
      status,
    )
  }
}

export default axiosInstance