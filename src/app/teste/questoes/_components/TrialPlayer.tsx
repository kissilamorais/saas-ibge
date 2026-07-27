'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react'

import { CTA_PRIMARY_ON_LIGHT } from '@/components/landing/brand'
import type {
  TrialAnswerInput,
  TrialCargo,
  TrialQuestion,
} from '@/lib/trial/types'

const LETRAS = ['A', 'B', 'C', 'D', 'E']

export function TrialPlayer({ cargo }: { cargo: TrialCargo }) {
  const router = useRouter()
  const [questions, setQuestions] = useState<TrialQuestion[] | null>(null)
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setErro(null)
    setQuestions(null)
    try {
      const res = await fetch('/api/trial/questions')
      const data = await res.json().catch(() => null)
      if (!res.ok || !Array.isArray(data?.questions) || !data.questions.length) {
        throw new Error(data?.error || 'Não foi possível carregar as questões.')
      }
      setQuestions(data.questions as TrialQuestion[])
      setIndice(0)
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar as questões.',
      )
    }
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function finalizar(todas: TrialQuestion[]) {
    setEnviando(true)
    setErro(null)

    const answers: TrialAnswerInput[] = todas
      .filter((q) => respostas[q.id])
      .map((q) => ({ question_id: q.id, selected_option_id: respostas[q.id] }))

    try {
      const res = await fetch('/api/trial/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cargo, answers }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.id) {
        throw new Error(data?.error || 'Não foi possível calcular seu resultado.')
      }
      router.push(`/teste/resultado?id=${data.id}`)
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : 'Não foi possível calcular seu resultado.',
      )
      setEnviando(false)
    }
  }

  if (erro && !questions) {
    return (
      <div className="rounded-2xl border border-[#0B3D2E]/10 bg-white p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto h-8 w-8 text-[#B3261E]" strokeWidth={1.75} />
        <p className="mt-4 text-sm text-[#0B3D2E]/80">{erro}</p>
        <button
          type="button"
          onClick={() => void carregar()}
          className="mt-6 text-sm font-semibold text-[#9A6E12] underline hover:text-[#0B3D2E]"
        >
          Tentar de novo
        </button>
      </div>
    )
  }

  if (!questions) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#0B3D2E]/10 bg-white p-12 shadow-sm">
        <Loader2 className="h-6 w-6 animate-spin text-[#D4A017]" />
        <p className="text-sm text-[#0B3D2E]/60">Montando seu diagnóstico…</p>
      </div>
    )
  }

  const questao = questions[indice]
  const total = questions.length
  const selecionada = respostas[questao.id]
  const ultima = indice === total - 1
  const progresso = ((indice + 1) / total) * 100

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0B3D2E]/50">
            Questão {indice + 1} de {total}
          </p>
          <p className="text-xs font-medium text-[#0B3D2E]/50">
            {questao.module_title}
          </p>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#0B3D2E]/10"
          role="progressbar"
          aria-valuenow={indice + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Questão ${indice + 1} de ${total}`}
        >
          <div
            className="h-full rounded-full bg-[#D4A017] transition-[width] duration-300"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[#0B3D2E]/10 bg-white p-6 shadow-sm sm:p-8">
        <p className="whitespace-pre-line text-base leading-relaxed text-[#0B3D2E]">
          {questao.question_text}
        </p>

        <div className="mt-6 space-y-2.5">
          {questao.options.map((opt, i) => {
            const marcada = selecionada === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={marcada}
                onClick={() =>
                  setRespostas((r) => ({ ...r, [questao.id]: opt.id }))
                }
                disabled={enviando}
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left text-sm transition-colors disabled:cursor-not-allowed ${
                  marcada
                    ? 'border-[#D4A017] bg-[#D4A017]/[0.08] text-[#0B3D2E]'
                    : 'border-[#0B3D2E]/10 bg-white text-[#0B3D2E]/85 hover:border-[#0B3D2E]/25 hover:bg-[#FAFAF7]'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                    marcada
                      ? 'bg-[#D4A017] text-[#0B3D2E]'
                      : 'bg-[#0B3D2E]/[0.06] text-[#0B3D2E]/60'
                  }`}
                >
                  {LETRAS[i] ?? i + 1}
                </span>
                <span className="flex-1 leading-relaxed">{opt.text}</span>
              </button>
            )
          })}
        </div>
      </div>

      {erro && (
        <p
          role="alert"
          className="rounded-lg bg-[#B3261E]/10 px-3 py-2 text-sm text-[#B3261E]"
        >
          {erro}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!selecionada || enviando}
          onClick={() =>
            ultima ? void finalizar(questions) : setIndice((i) => i + 1)
          }
          className={`${CTA_PRIMARY_ON_LIGHT} w-full disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto`}
        >
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
          {ultima ? 'Ver meu resultado' : 'Próxima questão'}
          {!enviando && <ArrowRight className="h-4 w-4" strokeWidth={2.5} />}
        </button>
      </div>
    </div>
  )
}
