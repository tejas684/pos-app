'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ApiError } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { requestOtp, loginWithOtp, isAuthenticated, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirect = searchParams.get('redirect') || '/'

  if (isAuthenticated && !isLoading) {
    router.replace(redirect)
    return null
  }

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    setSubmitting(true)
    try {
      await requestOtp(email.trim())
      setStep('otp')
      setOtp('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send OTP. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLoginWithOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!otp.trim()) {
      setError('Please enter the OTP.')
      return
    }
    setSubmitting(true)
    try {
      await loginWithOtp(email.trim(), otp.trim())
      router.replace(redirect)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid OTP or login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4 xs:p-6 overflow-x-hidden">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 xs:p-8 border border-neutral-200 container-responsive">
        <h1 className="text-2xl font-bold text-neutral-800 text-center mb-2">FoodGo POS</h1>
        <p className="text-neutral-500 text-center mb-6">Sign in to continue</p>

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="you@example.com"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginWithOtp} className="space-y-4">
            <p className="text-sm text-neutral-600">
              OTP sent to <strong>{email}</strong>. Check your inbox.
            </p>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-neutral-700 mb-1">
                OTP
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                placeholder="Enter OTP"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setError(''); setOtp(''); }}
              className="w-full py-2 text-neutral-600 hover:text-neutral-800 text-sm"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
