'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'

import { TRIAL_CARGOS, type TrialCargo } from '@/lib/trial/types'

/**
 * Escolha do cargo do diagnóstico.
 *
 * A escrita passa por POST /api/trial/cargo em vez de ir direto ao Supabase: o
 * visitante do teste não tem conta (é uma sessão de convidado), `trial_leads`
 * só aceita service_role e o cookie do funil precisa ser reemitido com o cargo.
 * A rota grava as duas grafias do valor (trial_cargo 'ACA' + target_function
 * 'aca'), como antes.
 */
export function CargoPicker({
  cargoAtual,
}: {
  cargoAtual: TrialCargo | null
}) {
  const router = useRouter()
  const [salvando, setSalvando] = useState<TrialCargo | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function escolher(cargo: TrialCargo) {
    if (salvando) return
    setErro(null)
    setSalvando(cargo)

    const res = await fetch('/api/trial/cargo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cargo }),
    }).catch(() => null)

    // 401 = cookie do funil expirou (2h): recomeça em vez de insistir.
    if (res?.status === 401) {
      router.push('/teste')
      return
    }

    if (!res?.ok) {
      setErro('Não foi possível salvar sua escolha. Tente de novo.')
      setSalvando(null)
      return
    }

    router.push('/teste/questoes')
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {TRIAL_CARGOS.map(({ value, label }) => {
        const ativo = salvando === value
        const selecionado = cargoAtual === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => escolher(value)}
            disabled={salvando !== null}
            aria-busy={ativo}
            className={`group flex w-full items-center gap-4 rounded-xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#D4A017] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none ${
              selecionado
                ? 'border-[#D4A017] shadow-sm'
                : 'border-[#0B3D2E]/10 shadow-sm'
            }`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#EAF1EC] font-serif text-sm font-bold tracking-wide text-[#0B3D2E]">
              {value}
            </span>
            <span className="flex-1 text-sm font-medium text-[#0B3D2E]">
              {label}
            </span>
            {ativo ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#D4A017]" />
            ) : (
              <ArrowRight
                className="h-4 w-4 shrink-0 text-[#0B3D2E]/25 transition-colors group-hover:text-[#D4A017]"
                strokeWidth={2}
              />
            )}
          </button>
        )
      })}

      {erro && (
        <p
          role="alert"
          className="rounded-lg bg-[#B3261E]/10 px-3 py-2 text-sm text-[#B3261E]"
        >
          {erro}
        </p>
      )}
    </div>
  )
}
