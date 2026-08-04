'use client'

import { useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { useConsent } from '@/components/consent/ConsentProvider'

/**
 * Banner de cookies (VUL-A04). Só aparece enquanto `consent` for null (visitante
 * ainda não decidiu). Os necessários nunca são opt-in — só Analytics (GA4) e
 * Marketing (Meta Pixel/CAPI) dependem desta escolha, que
 * <ConsentGatedAnalytics> lê para montar (ou não) cada script.
 *
 * O texto lista os necessários que o app REALMENTE grava: a sessão do Supabase
 * Auth (login), o `trial_session` do teste gratuito (src/lib/trial-session.ts)
 * e o próprio `aprovus_consent`. Antes falava em "carrinho", que nunca existiu
 * aqui — o checkout é link direto da InfinitePay, sem cesta. Descrever cookie
 * inexistente num aviso de privacidade é o tipo de imprecisão que a LGPD cobra,
 * então mantenha esta lista colada no que o código faz.
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
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
    >
      {/* Cartão flutuante em vez de faixa colada na borda: a barra de ponta a
          ponta lia como "parede" no fim da página, ainda mais no celular. */}
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-lg sm:p-5">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Usamos cookies. Os essenciais mantêm você logado e guardam seu teste
            gratuito.
          </p>
          <p className="text-sm text-muted-foreground">
            Os outros medem como o site é usado e o resultado dos anúncios —
            esses só rodam se você deixar. Detalhes na{' '}
            <Link
              href="/privacidade"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Política de Privacidade
            </Link>
            .
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

        {/* Aceitar e recusar ficam lado a lado, do mesmo tamanho e a um clique
            cada: pela LGPD, negar não pode ser mais trabalhoso que consentir.
            "Personalizar" é ghost por ser o caminho de quem quer detalhe, não
            por ser menos importante. */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            className="w-full sm:w-auto"
            onClick={() => setConsent({ analytics: true, marketing: true })}
          >
            Aceitar todos
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setConsent({ analytics: false, marketing: false })}
          >
            Só os essenciais
          </Button>
          {expanded ? (
            <Button
              variant="secondary"
              className="w-full sm:ml-auto sm:w-auto"
              onClick={() => setConsent({ analytics, marketing })}
            >
              Salvar preferências
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="w-full sm:ml-auto sm:w-auto"
              onClick={() => setExpanded(true)}
            >
              Personalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
