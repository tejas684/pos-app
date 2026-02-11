/**
 * Auth API – OTP login flow (generate-otp, login-otp) and logout.
 */

import { apiPost } from './client'

/** API response shape for login */
export interface LoginResponse {
  token: string
  user?: {
    id: string
    name?: string
    email?: string
    role?: string
  }
  message?: string
}

export interface LoginPayload {
  email?: string
  username?: string
  password?: string
  otp?: string
}

const AUTH_TOKEN_KEY = 'pos_token'
const AUTH_USER_KEY = 'pos_user'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function getStoredUser(): LoginResponse['user'] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setAuthStorage(token: string, user?: LoginResponse['user']) {
  if (typeof window === 'undefined') return
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  }
}

export function clearAuthStorage() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

/** Generate OTP – POST to /api/admin/generate-otp */
export async function generateOtpApi(email: string): Promise<{ message?: string }> {
  return apiPost<{ message?: string }>(
    'api/admin/generate-otp',
    { email: email.trim() },
    { skipAuth: true }
  )
}

/** Login with OTP – POST to /api/admin/login-otp; stores token on success */
export async function loginWithOtpApi(email: string, otp: string): Promise<LoginResponse> {
  const data = await apiPost<LoginResponse>(
    'api/admin/login-otp',
    { email: email.trim(), otp: otp.trim() },
    { skipAuth: true }
  )
  if (data.token) {
    setAuthStorage(data.token, data.user)
  }
  return data
}

/**
 * Legacy login (kept for compatibility; not used with OTP flow).
 */
export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
  const data = await apiPost<LoginResponse>(
    'api/auth/login',
    payload,
    { skipAuth: true }
  )
  if (data.token) {
    setAuthStorage(data.token, data.user)
  }
  return data
}

/**
 * Logout – clear local auth state.
 */
export async function logoutApi(): Promise<void> {
  try {
    await apiPost('api/auth/logout', {}, { skipAuth: false })
  } catch {
    // Ignore errors; we clear local state anyway
  } finally {
    clearAuthStorage()
  }
}
