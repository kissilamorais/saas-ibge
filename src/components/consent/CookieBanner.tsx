'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useConsent } from '@/components/consent/ConsentProvider'

/**
 * Banner de cookies (VUL-A04). Só aparece enquanto `consent` for null (visitante
 * ainda não decidiu). "Necessários" (sessão/carrinho) nunca é opt-in — só
 * Analytics (GA4) e Marketing (Meta Pixel/CAPI) dependem desta escolha, que
 * <ConsentGatedAnalytics> lê para montar (ou não) cada script.
 */
export function CookieBanner() {
  const { consent, ready, setConsent } = useConsent()
  const [expanded, setExpanded] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(true)

  if (!ready || consent !== null) return null

  return (
    <div
      role="dialog"
      aria-label="Preferências de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card p-4 shadow-lg sm:p-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Usamos cookies para o site funcionar e, com sua permissão, para
            entender o uso e medir campanhas.
          </p>
          <p className="text-sm text-muted-foreground">
            Cookies necessários (login, carrinho) sempre ficam ativos.
            Analytics e marketing só rodam se você aceitar.
          </p>
        </div>

        {expanded && (
          <div className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-2">
            <label className="flex items-start gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
              />
              <span>
                <span className="font-medium">Analytics</span> — Google
                Analytics, para entender como o site é usado.
              </span>
            </label>
            <label className="flex items-start gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
              />
              <span>
                <span className="font-medium">Marketing</span> — Meta Pixel,
                para medir o resultado dos anúncios.
              </span>
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setConsent({ analytics: true, marketing: true })}
          >
            Aceitar todos
          </Button>
          <Button
            variant="outline"
            onClick={() => setConsent({ analytics: false, marketing: false })}
          >
            Recusar não essenciais
          </Button>
          {expanded ? (
            <Button
              variant="secondary"
              onClick={() => setConsent({ analytics, marketing })}
            >
              Salvar preferências
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setExpanded(true)}>
              Personalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
