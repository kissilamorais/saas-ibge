'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
          Algo deu errado
        </h2>
        <p style={{ color: '#666', maxWidth: '28rem' }}>
          {error.message || 'Ocorreu um erro inesperado.'}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            borderRadius: '0.5rem',
            background: '#2563eb',
            color: '#fff',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  )
}
