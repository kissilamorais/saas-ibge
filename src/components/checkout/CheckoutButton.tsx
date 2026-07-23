'use client'

import { useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

import { trackPixel } from '@/lib/analytics/meta-pixel'

const DEFAULT_CLASS =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50'

interface CheckoutButtonProps {
  /** Classes do <button>. Default = estilo usado na página de checkout. */
  className?: string
  /** Rótulo do botão. Default = "Liberar acesso por R$97". */
  children?: ReactNode
}

export function CheckoutButton({
  className = DEFAULT_CLASS,
  children = 'Liberar acesso por R$97',
}: CheckoutButtonProps = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    // Intenção de compra → InitiateCheckout (com valor do curso).
    trackPixel('InitiateCheckout', { value: 97, currency: 'BRL' })
    try {
      const res = await fetch('/api/infinitepay/checkout', { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Erro ao iniciar pagamento')
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar pagamento')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
