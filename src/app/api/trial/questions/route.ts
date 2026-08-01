import { NextResponse, type NextRequest } from 'next/server'

import { clientIp, rateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  createTrialSession,
  getTrialSessionFromRequest,
  type TrialSessionData,
} from '@/lib/trial-session'
import type { TrialQuestion } from '@/lib/trial/types'

/**
 * GET /api/trial/questions — 10 questões do diagnóstico gratuito.
 *
 * Usa o service_role porque `questions`/`question_options` estão atrás do RLS
 * de assinatura (private.has_content_access) e o usuário do teste, por
 * definição, não tem acesso pago. O gate NÃO é afrouxado: quem libera as 10
 * questões é esta rota, que devolve um recorte sanitizado — `is_correct` é
 * removido antes da resposta sair do servidor.
 *
 * Exige sessão mesmo assim: sem isso a rota viraria um raspador anônimo do
 * banco de questões. A sessão aqui é a de CONVIDADO (cookie assinado do
 * funil), não a do Supabase Auth — o visitante do teste não tem conta.
 *
 * VUL-A06 (auditoria 31/07/2026): sortear sobre TODO o acervo (1.096 itens)
 * tornava a rota um raspador em ~40min de chamadas repetidas. Agora o sorteio
 * (a) é restrito ao pool `is_trial_sample` (50 questões, 0016) e (b) é
 * persistido por lead — a primeira chamada grava os 10 ids em
 * trial_leads.sampled_question_ids e no próprio cookie; chamadas seguintes
 * (refresh, retomada, reload) devolvem sempre o MESMO conjunto em vez de
 * ampliar a amostra vista por aquele lead.
 */

const DISTRIBUICAO = [
  { slug: 'portugues', quantidade: 3 },
  { slug: 'raciocinio-logico', quantidade: 3 },
  { slug: 'administracao', quantidade: 2 },
  { slug: 'informatica', quantidade: 1 },
  { slug: 'conhecimentos-tecnicos', quantidade: 1 },
] as const

/**
 * Fisher-Yates. `sort(() => Math.random() - 0.5)` é enviesado (o comparador é
 * inconsistente) e deixaria as primeiras questões do pool sobrerrepresentadas.
 */
function embaralhar<T>(itens: T[]): T[] {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

type QuestionRow = {
  id: string
  question_text: string
  difficulty: string | null
  module_id: string
  question_options: {
    id: string
    text: string
    is_correct: boolean
    order_index: number | null
  }[]
}

export async function GET(request: NextRequest) {
  // Endurecido de 20 para 5/min (VUL-A06): com o sorteio agora persistido por
  // lead, uma sessão legítima só precisa chamar esta rota poucas vezes
  // (início do teste + algum reload eventual).
  const rl = await rateLimit('trial-questions', clientIp(request), 5, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um instante.' },
      { status: 429 },
    )
  }

  const session = await getTrialSessionFromRequest(request)
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: modulesData, error: modulesError } = await admin
    .from('modules')
    .select('id, title, slug')
    .in('slug', DISTRIBUICAO.map((d) => d.slug))

  if (modulesError || !modulesData) {
    return NextResponse.json(
      { error: 'Não foi possível carregar o teste.' },
      { status: 500 },
    )
  }

  const modules = modulesData as { id: string; title: string; slug: string }[]
  const tituloPorModulo = new Map(modules.map((m) => [m.id, m.title]))

  // Fonte de verdade do sorteio já feito: cookie primeiro (path rápido, sem
  // consulta extra); se ausente (cookie perdido/reemitido sem o campo), cai
  // para o que foi persistido em trial_leads na primeira chamada deste lead.
  let idsSorteados: string[] | null = session.sampledQuestionIds ?? null
  if (!idsSorteados || idsSorteados.length === 0) {
    const { data: leadRow } = await admin
      .from('trial_leads')
      .select('sampled_question_ids')
      .eq('id', session.leadId)
      .maybeSingle()
    const persisted = (
      leadRow as { sampled_question_ids: string[] | null } | null
    )?.sampled_question_ids
    if (persisted?.length) idsSorteados = persisted
  }

  const precisaSortear = !idsSorteados || idsSorteados.length === 0

  if (precisaSortear) {
    // Sorteia dentro do pool fixo de amostra (0016/VUL-A06) — nunca sobre o
    // acervo inteiro.
    const novosIds: string[] = []
    for (const { slug, quantidade } of DISTRIBUICAO) {
      const modulo = modules.find((m) => m.slug === slug)
      if (!modulo) continue

      const { data: ids } = await admin
        .from('questions')
        .select('id')
        .eq('module_id', modulo.id)
        .eq('question_type', 'multiple_choice')
        .eq('is_trial_sample', true)

      if (!ids?.length) continue
      novosIds.push(
        ...embaralhar(ids as { id: string }[])
          .slice(0, quantidade)
          .map((q) => q.id),
      )
    }
    idsSorteados = novosIds
  }

  if (!idsSorteados || idsSorteados.length === 0) {
    return NextResponse.json(
      { error: 'Nenhuma questão disponível no momento.' },
      { status: 503 },
    )
  }

  const { data: questionsData, error: questionsError } = await admin
    .from('questions')
    .select(
      'id, question_text, difficulty, module_id, question_options (id, text, is_correct, order_index)',
    )
    .in('id', idsSorteados)

  if (questionsError || !questionsData) {
    return NextResponse.json(
      { error: 'Não foi possível carregar o teste.' },
      { status: 500 },
    )
  }

  // Sanitização: `is_correct` é descartado aqui e não existe no tipo devolvido.
  // `as unknown as` — o tipo Database é mantido à mão e não declara os
  // Relationships que o PostgREST usa no select aninhado (padrão de queries.ts).
  const questions: TrialQuestion[] = (
    questionsData as unknown as QuestionRow[]
  ).map(
    (q) => ({
      id: q.id,
      question_text: q.question_text,
      module_id: q.module_id,
      module_title: tituloPorModulo.get(q.module_id) ?? '',
      difficulty: q.difficulty,
      options: embaralhar(q.question_options).map((opt, i) => ({
        id: opt.id,
        text: opt.text,
        order_index: i,
      })),
    }),
  )

  const response = NextResponse.json({ questions: embaralhar(questions) })

  if (precisaSortear) {
    // Persiste o sorteio: trial_leads é a fonte durável (sobrevive a cookie
    // perdido/expirado dentro da janela de reuso do lead); o cookie evita uma
    // consulta extra nas chamadas seguintes desta mesma sessão.
    const { error: persistError } = await admin
      .from('trial_leads')
      .update({ sampled_question_ids: idsSorteados })
      .eq('id', session.leadId)
    if (!persistError) {
      const updatedSession: TrialSessionData = {
        ...session,
        sampledQuestionIds: idsSorteados,
      }
      await createTrialSession(updatedSession, response)
    }
  }

  return response
}
