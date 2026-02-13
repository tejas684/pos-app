/**
 * ============================================================================
 * ROOT LAYOUT COMPONENT (app/layout.tsx)
 * ============================================================================
 * 
 * This is the root layout component for the Next.js 14 App Router.
 * It wraps all pages in the application and provides:
 * 
 * 1. HTML structure (<html>, <body> tags)
 * 2. Global CSS styles (imported from globals.css)
 * 3. Toast notification provider (for showing success/error messages)
 * 4. Metadata for SEO (title, description)
 * 
 * This layout is applied to ALL routes in the application automatically.
 * Any component or provider added here will be available throughout the app.
 * 
 * Next.js App Router Structure:
 * - app/ directory contains all routes
 * - layout.tsx at root level wraps all pages
 * - page.tsx files define the actual page content
 * - Each route folder can have its own layout.tsx for nested layouts
 */

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { POSDataProvider } from '@/contexts/POSDataContext'

// Load Inter font with optimizations
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

// Metadata for SEO and browser tab title
export const metadata: Metadata = {
  title: 'FoodGo - POS',
  description: 'FoodGo Point of Sale system for restaurants',
}

// Viewport configuration for mobile optimization
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

/**
 * RootLayout Component
 * 
 * @param children - All page components will be passed as children
 * @returns The root HTML structure with ToastProvider wrapper
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <div className="pos-zoom-wrapper">
          <AuthProvider>
            <POSDataProvider>
              <ToastProvider>{children}</ToastProvider>
            </POSDataProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  )
}
