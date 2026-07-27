import { NextResponse } from 'next/server'

import { clientIp, rateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
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
 * banco de questões (1.096 itens, ~10 por chamada).
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

export async function GET(request: Request) {
  const rl = await rateLimit('trial-questions', clientIp(request), 20, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um instante.' },
      { status: 429 },
    )
  }

  const {
    data: { user },
  } = await createClient().auth.getUser()
  if (!user) {
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

  // Sorteia sobre TODOS os ids do módulo (só uuid, consulta barata) em vez de
  // um pool fixo ordenado por created_at — que devolveria sempre as mesmas
  // questões iniciais e faria o teste repetir para quem refaz.
  const idsSorteados: string[] = []
  for (const { slug, quantidade } of DISTRIBUICAO) {
    const modulo = modules.find((m) => m.slug === slug)
    if (!modulo) continue

    const { data: ids } = await admin
      .from('questions')
      .select('id')
      .eq('module_id', modulo.id)
      .eq('question_type', 'multiple_choice')

    if (!ids?.length) continue
    idsSorteados.push(
      ...embaralhar(ids as { id: string }[])
        .slice(0, quantidade)
        .map((q) => q.id),
    )
  }

  if (idsSorteados.length === 0) {
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

  return NextResponse.json({ questions: embaralhar(questions) })
}
