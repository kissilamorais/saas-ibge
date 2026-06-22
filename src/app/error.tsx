'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

import { reportError } from '@/lib/observability/log'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportError('react.error-boundary', error, { digest: error.digest })
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive" />
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Algo deu errado</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {error.message || 'Ocorreu um erro inesperado. Tente novamente.'}
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Tentar novamente
      </button>
    </div>
  )
}
