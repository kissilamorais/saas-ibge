'use client'

// Fallback de último recurso: substitui o root layout, então globals.css/Tailwind
// não estão disponíveis. Estilos inline com as cores da marca (teal "Foco calmo"),
// nunca um azul hard-coded.
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
          background: '#FAFAF7',
          color: '#1F2421',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
          Algo deu errado
        </h2>
        <p style={{ color: '#5F6B66', maxWidth: '28rem', margin: 0 }}>
          Tivemos um problema inesperado. Tente novamente — costuma resolver.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            borderRadius: '0.625rem',
            background: '#0F6E56',
            color: '#fff',
            padding: '0.625rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 600,
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
