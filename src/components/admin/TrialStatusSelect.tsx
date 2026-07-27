'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { TRIAL_STATUS_OPTIONS, type TrialStatus } from '@/lib/trial/types'

/**
 * Cores por estágio.
 *
 * "Não comprou" fica NEUTRO de propósito, não vermelho: é o estado inicial de
 * todo lead, e pintar a tabela inteira de terracota no primeiro dia gastaria a
 * cor que o design system reserva para erro/urgência real (ver CLAUDE.md).
 * O dourado marca o estágio em andamento; o verde, a conversão.
 */
const ESTILO: Record<TrialStatus, string> = {
  nao_comprou: 'border-border bg-background text-muted-foreground',
  contatado: 'border-gold/40 bg-gold-soft text-gold',
  convertido: 'border-transparent bg-success-soft text-primary',
  sem_interesse: 'border-transparent bg-muted text-muted-foreground',
}

export function TrialStatusSelect({
  leadId,
  statusInicial,
}: {
  leadId: string
  statusInicial: TrialStatus
}) {
  const [status, setStatus] = useState<TrialStatus>(statusInicial)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(false)

  async function alterar(novo: TrialStatus) {
    const anterior = status
    // Otimista: o badge muda na hora e volta atrás se o PATCH falhar.
    setStatus(novo)
    setSalvando(true)
    setErro(false)

    try {
      const res = await fetch(`/api/admin/trial/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trial_status: novo }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setStatus(anterior)
      setErro(true)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={status}
        disabled={salvando}
        onChange={(e) => void alterar(e.target.value as TrialStatus)}
        aria-label="Estágio do lead"
        className={cn(
          'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-60',
          ESTILO[status],
          erro && 'border-destructive text-destructive',
        )}
      >
        {TRIAL_STATUS_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {salvando && (
        <Loader2
          className="h-3.5 w-3.5 animate-spin text-muted-foreground"
          aria-label="Salvando"
        />
      )}
      {erro && (
        <span role="alert" className="text-xs text-destructive">
          Erro
        </span>
      )}
    </div>
  )
}
