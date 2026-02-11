'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Wraps content that requires authentication.
 * Redirects to /login if not authenticated (after initial load).
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      const redirect = pathname && pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : ''
      router.replace(`/login${redirect}`)
    }
  }, [isAuthenticated, isLoading, router, pathname])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="text-neutral-500">Loading…</div>
      </div>
    )
  }

  return <>{children}</>
}
