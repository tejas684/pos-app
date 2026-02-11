/**
 * ============================================================================
 * TAILWIND CSS CONFIGURATION (tailwind.config.js)
 * ============================================================================
 * 
 * This file configures Tailwind CSS, a utility-first CSS framework.
 * 
 * Configuration:
 * 1. Content Paths - Tells Tailwind where to look for class names
 * 2. Theme Extensions - Custom colors, shadows, and border radius
 * 3. Custom Color Palette - Brand colors for the POS system
 * 
 * Custom Colors:
 * - primary: Blue tones (main brand color)
 * - accent: Purple/pink tones (secondary actions)
 * - success: Green tones (positive actions, confirmations)
 * - warning: Yellow/orange tones (warnings, cautions)
 * - danger: Red tones (errors, destructive actions)
 * 
 * Usage Example:
 * className="bg-primary-500 text-white hover:bg-primary-600"
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Content paths: Tailwind scans these files for class names
  // Only classes found in these files will be included in the final CSS
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // Next.js pages directory (if using Pages Router)
    './components/**/*.{js,ts,jsx,tsx,mdx}', // All component files
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Next.js App Router directory
  ],
  theme: {
    extend: {
      // Extra breakpoints for all devices + zoom scenarios
      // Zoom changes effective viewport; these breakpoints respond accordingly
      screens: {
        xs: '375px',     // Small phones (iPhone SE, etc.)
        '3xl': '1920px', // Large monitors
      },
      colors: {
        // Enhanced Primary - Modern Blue
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Enhanced Accent - Vibrant Purple
        accent: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        // Enhanced Success - Fresh Green
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Enhanced Warning - Warm Amber
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Enhanced Danger - Bold Red
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Neutral grays for better contrast
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.1)',
        'strong': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-accent': '0 0 20px rgba(168, 85, 247, 0.4)',
        'glow-success': '0 0 20px rgba(34, 197, 94, 0.4)',
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'gradient-accent': 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
        'gradient-success': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'gradient-surface': 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        'gradient-pos': 'linear-gradient(152deg, #f8fafc 0%, #f1f5f9 28%, #e2e8f0 55%, #f1f5f9 82%, #f8fafc 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
