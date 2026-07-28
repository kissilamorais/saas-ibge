import { NextResponse, type NextRequest } from 'next/server'

import { clientIp, rateLimit } from '@/lib/rate-limit'
import { reportError } from '@/lib/observability/log'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTrialSessionFromRequest } from '@/lib/trial-session'
import { calcularResultado } from '@/lib/trial/scoring'
import { isTrialCargo, type TrialAnswer } from '@/lib/trial/types'
import type { Json } from '@/types'

/**
 * POST /api/trial/result — corrige o diagnóstico e grava o resultado.
 *
 * Recebe apenas `{ question_id, selected_option_id }`. O `is_correct` NUNCA vem
 * do cliente: é lido do banco aqui (mesma regra da correção de simulado). Por
 * isso não existe rota de "check" separada — ela seria um oráculo de gabarito.
 */

export async function POST(request: NextRequest) {
  const rl = await rateLimit('trial-result', clientIp(request), 10, 60)
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

  const body = (await request.json().catch(() => null)) as {
    cargo?: unknown
    answers?: unknown
  } | null

  if (!isTrialCargo(body?.cargo)) {
    return NextResponse.json({ error: 'Cargo inválido.' }, { status: 400 })
  }
  if (!Array.isArray(body?.answers) || body.answers.length === 0) {
    return NextResponse.json({ error: 'Respostas ausentes.' }, { status: 400 })
  }

  // Deduplica por questão (last write wins) e descarta entradas malformadas.
  const porQuestao = new Map<string, string>()
  for (const raw of body.answers) {
    const a = raw as { question_id?: unknown; selected_option_id?: unknown }
    if (
      typeof a?.question_id === 'string' &&
      typeof a?.selected_option_id === 'string'
    ) {
      porQuestao.set(a.question_id, a.selected_option_id)
    }
  }
  if (porQuestao.size === 0) {
    return NextResponse.json({ error: 'Respostas inválidas.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Gabarito: lido do banco, junto com o question_id dono da opção — a opção
  // precisa pertencer à questão que o cliente diz ter respondido, senão dá para
  // desviar a resposta para outro módulo e falsear o diagnóstico.
  const { data: optionsData, error: optionsError } = await admin
    .from('question_options')
    .select('id, question_id, is_correct')
    .in('id', [...porQuestao.values()])

  const { data: questionsData, error: questionsError } = await admin
    .from('questions')
    .select('id, module_id, modules (title)')
    .in('id', [...porQuestao.keys()])

  if (optionsError || questionsError || !optionsData || !questionsData) {
    return NextResponse.json(
      { error: 'Não foi possível corrigir o teste.' },
      { status: 500 },
    )
  }

  const opcaoPorId = new Map(
    (optionsData as { id: string; question_id: string; is_correct: boolean }[]).map(
      (o) => [o.id, o],
    ),
  )
  // `as unknown as` — o tipo Database é mantido à mão e não declara os
  // Relationships que o PostgREST usa no select aninhado (padrão de queries.ts).
  const tituloPorQuestao = new Map(
    (
      questionsData as unknown as {
        id: string
        module_id: string
        modules: { title: string } | null
      }[]
    ).map((q) => [q.id, q.modules?.title ?? 'Outros']),
  )

  const answers: TrialAnswer[] = []
  for (const [question_id, selected_option_id] of porQuestao) {
    const opcao = opcaoPorId.get(selected_option_id)
    const module_title = tituloPorQuestao.get(question_id)
    // Opção inexistente ou de outra questão → resposta descartada.
    if (!opcao || !module_title || opcao.question_id !== question_id) continue

    answers.push({
      question_id,
      selected_option_id,
      is_correct: opcao.is_correct,
      module_title,
    })
  }

  if (answers.length === 0) {
    return NextResponse.json({ error: 'Respostas inválidas.' }, { status: 400 })
  }

  const resultado = calcularResultado(answers)

  // Insert via service_role: quem responde é um convidado, sem linha em
  // auth.users para a policy `usuario_insere_proprio_resultado` casar. O dono
  // do resultado é o lead do cookie assinado — `lead_id` NÃO vem do corpo da
  // requisição, senão daria para gravar diagnóstico na ficha de outro lead.
  const { data: inserted, error: insertError } = await admin
    .from('free_trial_results')
    .insert({
      lead_id: session.leadId,
      cargo: body.cargo,
      answers: answers as unknown as Json,
      score_geral: resultado.score_geral,
      score_por_modulo: resultado.score_por_modulo,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    reportError(
      'trial.result.insert',
      insertError ?? new Error('insert retornou vazio'),
      { leadId: session.leadId },
    )
    return NextResponse.json(
      { error: 'Não foi possível salvar seu resultado.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ id: (inserted as { id: string }).id, resultado })
}
