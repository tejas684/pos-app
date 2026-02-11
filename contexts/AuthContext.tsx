'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { LoginResponse } from '@/lib/api'
import { getStoredToken, getStoredUser, generateOtpApi, loginWithOtpApi, logoutApi, clearAuthStorage } from '@/lib/api'

type User = LoginResponse['user'] | null

interface AuthState {
  user: User
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  /** Request OTP for the given email */
  requestOtp: (email: string) => Promise<void>
  /** Login with email + OTP; stores token and user on success */
  loginWithOtp: (email: string, otp: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const t = getStoredToken()
    const u = getStoredUser()
    setToken(t)
    setUserState(u)
    setIsLoading(false)
  }, [])

  const requestOtp = useCallback(async (email: string) => {
    await generateOtpApi(email)
  }, [])

  const loginWithOtp = useCallback(async (email: string, otp: string) => {
    setIsLoading(true)
    try {
      const res = await loginWithOtpApi(email, otp)
      setToken(res.token)
      setUserState(res.user ?? null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await logoutApi()
    } finally {
      setToken(null)
      setUserState(null)
      setIsLoading(false)
    }
  }, [])

  const setUser = useCallback((u: User) => {
    setUserState(u)
  }, [])

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    requestOtp,
    loginWithOtp,
    logout,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
