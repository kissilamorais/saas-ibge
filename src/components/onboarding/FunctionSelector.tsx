'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'

import { setTargetFunction } from '@/lib/actions/profile'
import { FUNCTIONS } from '@/lib/functions'
import { cn } from '@/lib/utils'
import type { FunctionCode } from '@/types'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_function: 'Selecione uma função válida.',
  not_authenticated: 'Sua sessão expirou. Entre novamente.',
  unexpected_error: 'Algo deu errado. Tente novamente.',
}

interface FunctionSelectorProps {
  initial?: FunctionCode | null
  /** Rota para onde ir após salvar (default: /dashboard). */
  redirectTo?: string
  ctaLabel?: string
}

export function FunctionSelector({
  initial = null,
  redirectTo = '/dashboard',
  ctaLabel = 'Começar a estudar',
}: FunctionSelectorProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<FunctionCode | null>(initial)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!selected) {
      setError('Selecione uma função para continuar.')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await setTargetFunction(selected)
      if (res.ok) {
        router.replace(redirectTo)
        router.refresh()
      } else {
        setError(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.unexpected_error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div
        role="radiogroup"
        aria-label="Escolha sua função"
        className="grid gap-3 sm:grid-cols-2"
      >
        {FUNCTIONS.map((fn) => {
          const isActive = selected === fn.code
          return (
            <button
              key={fn.code}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setSelected(fn.code)}
              className={cn(
                'flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors',
                isActive
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-input hover:border-primary/50 hover:bg-accent'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{fn.short}</span>
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </div>
              <span className="text-sm font-medium">{fn.name}</span>
              <span className="text-sm text-muted-foreground">
                {fn.description}
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <p
          role="alert"
          aria-live="assertive"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {ctaLabel}
      </button>
    </div>
  )
}
