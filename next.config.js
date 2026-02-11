/**
 * ============================================================================
 * NEXT.JS CONFIGURATION (next.config.js)
 * ============================================================================
 * 
 * This file configures Next.js build and runtime settings.
 * 
 * Key Configurations:
 * 1. React Strict Mode - Enables additional React development checks
 * 2. Image Optimization - Configures allowed image domains for Next.js Image component
 * 3. Security Headers - Adds HTTP security headers to all responses
 * 
 * Security Headers Explained:
 * - X-DNS-Prefetch-Control: Enables DNS prefetching for faster page loads
 * - Strict-Transport-Security: Forces HTTPS connections (HSTS)
 * - X-Frame-Options: Prevents clickjacking attacks
 * - X-Content-Type-Options: Prevents MIME type sniffing
 * - X-XSS-Protection: Enables browser XSS filtering
 * - Referrer-Policy: Controls referrer information sent with requests
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode helps identify potential problems in development
  // It runs components twice in development to detect side effects
  reactStrictMode: true,

  // Use in-memory webpack cache in dev to avoid EPERM on .next/cache (Windows file locks)
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: 'memory' }
    }
    return config
  },

  // Image optimization configuration
  // Next.js Image component can only load images from allowed domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Stock photos
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // Placeholder images
      },
      {
        protocol: 'https',
        hostname: 'placehold.co', // Alternative placeholder service
      },
    ],
  },
  
  // Security headers applied to all routes
  // These headers help protect against common web vulnerabilities
  async headers() {
    return [
      {
        source: '/:path*', // Apply to all routes
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on' // Prefetch DNS for faster page loads
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload' // Force HTTPS for 2 years
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN' // Prevent embedding in iframes from other domains
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff' // Prevent MIME type sniffing attacks
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block' // Enable browser XSS protection
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin' // Control referrer information
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
