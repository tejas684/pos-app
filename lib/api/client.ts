/**
 * API client – base URL, auth header, and shared fetch wrapper.
 * Replace BASE_URL and endpoint paths with your actual API when provided.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://demo.webwideit.solutions/pos-aishwarya/public'

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiRequestConfig {
  method?: RequestMethod
  body?: unknown
  headers?: Record<string, string>
  /** If true, do not send Authorization header (e.g. for login) */
  skipAuth?: boolean
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('pos_token')
}

export async function apiRequest<T>(
  path: string,
  config: ApiRequestConfig = {}
): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = config
  const url = path.startsWith('http') ? path : `${BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (!skipAuth) {
    const token = getAuthToken()
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`
    }
  }

  const options: RequestInit = {
    method,
    headers: requestHeaders,
  }

  if (body !== undefined && method !== 'GET') {
    options.body = JSON.stringify(body)
  }

  const res = await fetch(url, options)
  const contentType = res.headers.get('content-type') ?? ''
  const text = await res.text().catch(() => '')

  let data: unknown = {}
  if (contentType.includes('application/json') || (text && (text.startsWith('{') || text.startsWith('[')))) {
    try {
      data = text ? (JSON.parse(text) as unknown) : {}
    } catch {
      data = {}
    }
  }

  if (!res.ok) {
    let message = res.statusText || 'Request failed'
    if (res.status >= 500) {
      message = 'Server error. Please try again or contact support.'
    }
    if (data && typeof data === 'object') {
      if (typeof (data as Record<string, unknown>).message === 'string' && (data as Record<string, unknown>).message) {
        message = (data as Record<string, unknown>).message as string
      } else if (typeof (data as Record<string, unknown>).error === 'string' && (data as Record<string, unknown>).error) {
        message = (data as Record<string, unknown>).error as string
      } else {
        const errs = (data as Record<string, unknown>).errors
        if (errs && typeof errs === 'object') {
          const first = Object.values(errs).flat()
          const msg = Array.isArray(first) ? first[0] : first
          if (typeof msg === 'string') message = msg
        }
      }
    }
    throw new ApiError(message, res.status, data)
  }

  return data as T
}

/** GET request */
export function apiGet<T>(path: string, config?: Omit<ApiRequestConfig, 'method' | 'body'>) {
  return apiRequest<T>(path, { ...config, method: 'GET' })
}

/** POST request */
export function apiPost<T>(path: string, body?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>) {
  return apiRequest<T>(path, { ...config, method: 'POST', body })
}

/** PUT request */
export function apiPut<T>(path: string, body?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>) {
  return apiRequest<T>(path, { ...config, method: 'PUT', body })
}

/** PATCH request */
export function apiPatch<T>(path: string, body?: unknown, config?: Omit<ApiRequestConfig, 'method' | 'body'>) {
  return apiRequest<T>(path, { ...config, method: 'PATCH', body })
}

/** DELETE request */
export function apiDelete<T>(path: string, config?: Omit<ApiRequestConfig, 'method' | 'body'>) {
  return apiRequest<T>(path, { ...config, method: 'DELETE' })
}
