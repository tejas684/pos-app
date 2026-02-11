'use client'

/**
 * Global error boundary for the root layout.
 * Catches ChunkLoadError (e.g. timeout loading app/layout.js) and offers a retry.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isChunkLoadError =
    error?.name === 'ChunkLoadError' ||
    (error?.message && error.message.includes('Loading chunk'))

  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          {isChunkLoadError ? 'Failed to load page' : 'Something went wrong'}
        </h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          {isChunkLoadError
            ? 'The app chunk failed to load (often due to timeout or a slow connection). Click below to try again.'
            : error?.message || 'An unexpected error occurred.'}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            cursor: 'pointer',
            backgroundColor: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
          }}
        >
          Try again
        </button>
        {!isChunkLoadError && (
          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            style={{
              marginLeft: '0.75rem',
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              cursor: 'pointer',
              backgroundColor: '#eee',
              color: '#333',
              border: '1px solid #ccc',
              borderRadius: '6px',
            }}
          >
            Go home
          </button>
        )}
      </body>
    </html>
  )
}
