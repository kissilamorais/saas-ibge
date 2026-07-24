'use client'

import { useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

import { trackPixel } from '@/lib/analytics/meta-pixel'

const DEFAULT_CLASS =
  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50'

// Campo branco legível tanto sobre fundo claro (Hero/Offer) quanto sobre o
// petróleo escuro (Urgency). Foco dourado, alinhado ao "Foco calmo".
const EMAIL_INPUT_CLASS =
  'h-11 w-full rounded-lg border border-[#0B3D2E]/15 bg-white px-4 text-sm text-[#0B3D2E] shadow-sm placeholder:text-[#5F6B66] focus:border-[#D4A017] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/30'

// Formato de e-mail simples (obrigatório): tem algo, @, domínio com ponto.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface CheckoutButtonProps {
  /** Classes do <button>. Default = estilo usado na página de checkout. */
  className?: string
  /** Rótulo do botão. Default = "Liberar acesso por R$97". */
  children?: ReactNode
  /**
   * Fluxo guest (landing): coleta o e-mail do comprador ANTES de gerar o link,
   * para que o pedido nasça com `customer_email` e a conta seja provisionada
   * após o pagamento. No fluxo logado (/checkout) fica false: o e-mail já vem
   * da sessão no servidor.
   */
  collectEmail?: boolean
}

export function CheckoutButton({
  className = DEFAULT_CLASS,
  children = 'Liberar acesso por R$97',
  collectEmail = false,
}: CheckoutButtonProps = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  async function handleClick() {
    setError(null)

    // Fluxo guest: exige e-mail válido antes de qualquer chamada / evento.
    const normalizedEmail = email.trim().toLowerCase()
    if (collectEmail) {
      if (!EMAIL_RE.test(normalizedEmail)) {
        setError('Digite um e-mail válido para receber seu acesso.')
        return
      }
    }

    setLoading(true)
    // Intenção de compra → InitiateCheckout (com valor do curso).
    trackPixel('InitiateCheckout', { value: 97, currency: 'BRL' })
    try {
      const res = await fetch('/api/infinitepay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectEmail ? { email: normalizedEmail } : {}),
      })
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
    <div className="w-full space-y-2">
      {collectEmail && (
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Seu melhor e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          aria-label="E-mail para receber o acesso"
          className={EMAIL_INPUT_CLASS}
        />
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
      {collectEmail && !error && (
        <p className="text-center text-xs text-[#5F6B66]">
          Enviaremos o link de acesso para esse e-mail.
        </p>
      )}
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
