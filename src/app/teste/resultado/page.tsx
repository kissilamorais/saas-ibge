import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, Check, CheckCircle2, ShieldCheck } from 'lucide-react'

import { CheckoutButton } from '@/components/checkout/CheckoutButton'
import { CTA_PRIMARY_ON_LIGHT } from '@/components/landing/brand'
import { hasContentAccess } from '@/lib/auth/session'
import { BONUSES, FINAL_REVIEW_DATE } from '@/lib/bonuses/config'
import { currentPriceLabel } from '@/lib/pricing'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTrialSession } from '@/lib/trial-session'
import { calcularResultado } from '@/lib/trial/scoring'
import type { TrialAnswer, TrialNivel } from '@/lib/trial/types'

/** Cores do selo de nível — paleta da landing (verde-status / bronze / erro). */
const NIVEL_ESTILO: Record<TrialNivel, string> = {
  Avançado: 'bg-[#1F7A52] text-white',
  'Em desenvolvimento':
    'bg-[#D4A017]/15 text-[#9A6E12] ring-1 ring-inset ring-[#D4A017]/40',
  Iniciante: 'bg-[#B3261E]/10 text-[#B3261E] ring-1 ring-inset ring-[#B3261E]/25',
}

function tituloBonus(slug: string): string {
  return BONUSES.find((b) => b.slug === slug)?.title ?? slug
}

/** "2026-09-20" → "20/09". Rótulo de dia, sem componente de fuso. */
function rotuloData(iso: string): string {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

// Nomes dos bônus vêm de lib/bonuses/config — a landing e o /dashboard leem a
// mesma fonte, então um rename (ex.: "Edital esquematizado" → "Resumo
// Estratégico") não deixa esta página anunciando um produto que não existe.
const BENEFICIOS = [
  'Garantia de 7 dias — reembolso se não gostar',
  'Acesso imediato a todos os módulos',
  tituloBonus('cronograma'),
  tituloBonus('edital-esquematizado'),
  `${tituloBonus('revisao-final')} (libera ${rotuloData(FINAL_REVIEW_DATE)})`,
  tituloBonus('grupo-telegram'),
]

function ListaModulos({
  modulos,
  vazio,
  scores,
}: {
  modulos: string[]
  /** Fallback da lista vazia. Omitido quando a seção só é montada com itens. */
  vazio?: string
  scores: Record<string, number>
}) {
  if (modulos.length === 0) {
    return vazio ? <p className="mt-2 text-sm text-[#0B3D2E]/60">{vazio}</p> : null
  }
  return (
    <ul className="mt-3 space-y-2">
      {modulos.map((m) => (
        <li
          key={m}
          className="flex items-center justify-between gap-3 rounded-lg bg-[#0B3D2E]/[0.03] px-3 py-2 text-sm"
        >
          <span className="text-[#0B3D2E]">{m}</span>
          <span className="shrink-0 font-semibold tabular-nums text-[#0B3D2E]/60">
            {scores[m]}%
          </span>
        </li>
      ))}
    </ul>
  )
}

export default async function ResultadoPage({
  searchParams,
}: {
  searchParams: { id?: string }
}) {
  const session = await getTrialSession()
  if (!session) redirect('/teste')

  const id = searchParams.id
  if (!id) redirect('/teste/cargo')

  // Service_role porque o convidado não tem linha em auth.users para a policy
  // `usuario_ve_proprio_resultado` casar. O escopo continua existindo: além do
  // id, a busca exige o lead_id do cookie assinado — o id de outra pessoa
  // simplesmente não retorna linha.
  const { data } = await createAdminClient()
    .from('free_trial_results')
    .select('id, answers, completed_at')
    .eq('id', id)
    .eq('lead_id', session.leadId)
    .maybeSingle()

  if (!data) redirect('/teste/cargo')

  // `answers` é jsonb (tipo Json); o formato gravado é sempre TrialAnswer[],
  // montado no servidor por /api/trial/result.
  const answers = (data as unknown as { answers: TrialAnswer[] }).answers ?? []
  // Recalculado a partir das respostas gravadas (que já vieram corrigidas do
  // servidor) — evita guardar nivel/dominou/precisa_estudar duplicados no banco.
  const resultado = calcularResultado(answers)
  const acertos = answers.filter((a) => a.is_correct).length
  const temDominio = resultado.dominou.length > 0

  const primeiroNome = session.fullName.trim().split(/\s+/)[0] || null
  // Só é true para quem já comprou E está logado — o convidado do teste, por
  // definição, não tem conta ainda e cai no CTA de compra.
  const jaTemAcesso = await hasContentAccess()

  return (
    <div className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <div className="text-center">
        <CheckCircle2
          className="mx-auto h-12 w-12 text-[#1F7A52]"
          strokeWidth={1.5}
        />
        <h1 className="mt-5 text-balance font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Seu diagnóstico está pronto
        </h1>
        {primeiroNome && (
          <p className="mt-2 text-sm text-[#0B3D2E]/70">Olá, {primeiroNome}</p>
        )}
      </div>

      <div className="mt-10 rounded-2xl border border-[#0B3D2E]/10 bg-white p-6 text-center shadow-sm sm:p-8">
        <span
          className={`inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${NIVEL_ESTILO[resultado.nivel]}`}
        >
          {resultado.nivel}
        </span>
        <p className="mt-5 font-serif text-4xl font-semibold tabular-nums text-[#0B3D2E]">
          {resultado.score_geral}%
        </p>
        <p className="mt-1 text-sm text-[#0B3D2E]/70">
          Você acertou {acertos} de {answers.length}{' '}
          {answers.length === 1 ? 'questão' : 'questões'}
        </p>
      </div>

      {/* "Você dominou" só existe quando há o que comemorar — um card vazio com
          "continue estudando" logo abaixo da nota vira consolo, não diagnóstico.
          Sem ele, "Precisa reforçar" ocupa a linha inteira. */}
      <div className={`mt-6 grid gap-4 ${temDominio ? 'sm:grid-cols-2' : ''}`}>
        {temDominio && (
          <section className="rounded-2xl border border-[#0B3D2E]/10 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#0B3D2E]">
              <Check className="h-4 w-4 text-[#1F7A52]" strokeWidth={3} />
              Você dominou
            </h2>
            <ListaModulos
              modulos={resultado.dominou}
              scores={resultado.score_por_modulo}
            />
          </section>
        )}

        <section className="rounded-2xl border border-[#0B3D2E]/10 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#0B3D2E]">
            <AlertTriangle className="h-4 w-4 text-[#D4A017]" strokeWidth={2.5} />
            Precisa reforçar
          </h2>
          <ListaModulos
            modulos={resultado.precisa_estudar}
            scores={resultado.score_por_modulo}
            vazio="Você está bem em todas as áreas!"
          />
        </section>
      </div>

      <hr className="my-10 border-[#0B3D2E]/10" />

      <section className="rounded-2xl border border-[#D4A017]/30 bg-[#EAF1EC] p-6 text-center sm:p-8">
        <h2 className="text-balance font-serif text-2xl font-semibold leading-tight text-[#0B3D2E]">
          A plataforma cobre exatamente esses conteúdos.
        </h2>
        <p className="mt-3 text-balance text-sm text-[#0B3D2E]/75">
          Desbloqueie o acesso e estude o que você realmente precisa.
        </p>

        <div className="mx-auto mt-7 max-w-sm">
          {jaTemAcesso ? (
            <Link href="/dashboard" className={`${CTA_PRIMARY_ON_LIGHT} w-full`}>
              Ir para meus estudos
            </Link>
          ) : (
            <CheckoutButton
              className={`${CTA_PRIMARY_ON_LIGHT} w-full`}
              emailPadrao={session.email}
            >
              Quero desbloquear o Aprovus por {currentPriceLabel()} →
            </CheckoutButton>
          )}
        </div>

        <ul className="mx-auto mt-7 max-w-sm space-y-2 text-left">
          {BENEFICIOS.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2.5 text-sm text-[#0B3D2E]/80"
            >
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-[#1F7A52]"
                strokeWidth={3}
              />
              {b}
            </li>
          ))}
        </ul>

        <p className="mt-7 flex items-center justify-center gap-2 text-xs text-[#0B3D2E]/55">
          <ShieldCheck className="h-3.5 w-3.5 text-[#D4A017]" strokeWidth={1.75} />
          Pagamento único · acesso vitalício
        </p>
      </section>
    </div>
  )
}
