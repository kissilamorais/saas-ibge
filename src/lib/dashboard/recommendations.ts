/**
 * Geração de recomendações da dashboard a partir de dados reais (sem mock).
 * Função pura e testável (ver recommendations.test.ts): recebe estatísticas já
 * agregadas e devolve a lista priorizada. O fetch fica em queries.ts.
 */

export type RecommendationPriority = 'alta' | 'media' | 'baixa'
export type RecommendationKind = 'revisao' | 'fraqueza' | 'ritmo' | 'dica'

export interface Recommendation {
  id: string
  kind: RecommendationKind
  priority: RecommendationPriority
  title: string
  description: string
  href?: string
}

export interface ModuleAccuracy {
  slug: string
  title: string
  correct: number
  total: number
}

export interface RecommendationInput {
  moduleAccuracy: ModuleAccuracy[]
  weeklyHoursDone: number
  weeklyGoalHours: number
  syllabusProgress: number
  nextLesson: {
    moduleSlug: string
    lessonSlug: string
    title: string
  } | null
  nextExam: { slug: string; title: string } | null
}

/** Nº mínimo de questões respondidas num módulo para avaliar fraqueza. */
const MIN_ANSWERS_FOR_WEAKNESS = 4
/** Abaixo deste aproveitamento (%), o módulo é sinalizado como fraqueza. */
const WEAKNESS_THRESHOLD = 60

const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  alta: 0,
  media: 1,
  baixa: 2,
}

export function buildRecommendations(
  input: RecommendationInput
): Recommendation[] {
  const recs: Recommendation[] = []

  // 1. Fraqueza: módulo com pior aproveitamento (com amostra suficiente).
  const weakest = input.moduleAccuracy
    .filter((m) => m.total >= MIN_ANSWERS_FOR_WEAKNESS)
    .map((m) => ({ ...m, rate: Math.round((m.correct / m.total) * 100) }))
    .filter((m) => m.rate < WEAKNESS_THRESHOLD)
    .sort((a, b) => a.rate - b.rate)[0]

  if (weakest) {
    recs.push({
      id: `fraqueza-${weakest.slug}`,
      kind: 'fraqueza',
      priority: 'alta',
      title: `Reforce ${weakest.title}`,
      description: `Seu aproveitamento neste módulo está em ${weakest.rate}%. Revise as lições e refaça as questões.`,
      href: `/dashboard/modules/${weakest.slug}`,
    })
  }

  // 2. Ritmo: déficit em relação à meta semanal.
  if (input.weeklyGoalHours > 0 && input.weeklyHoursDone < input.weeklyGoalHours) {
    const deficit =
      Math.round((input.weeklyGoalHours - input.weeklyHoursDone) * 10) / 10
    const priority: RecommendationPriority =
      deficit > input.weeklyGoalHours / 2 ? 'alta' : 'media'
    recs.push({
      id: 'ritmo-semanal',
      kind: 'ritmo',
      priority,
      title: `Você está ${deficit}h atrás da meta semanal`,
      description: `Faltam ${deficit}h para bater a meta de ${input.weeklyGoalHours}h nesta semana.`,
    })
  }

  // 3. Continuar de onde parou (próxima lição pendente).
  if (input.nextLesson) {
    recs.push({
      id: 'proxima-licao',
      kind: 'revisao',
      priority: 'media',
      title: 'Continue de onde parou',
      description: `Próxima lição: ${input.nextLesson.title}.`,
      href: `/dashboard/modules/${input.nextLesson.moduleSlug}/${input.nextLesson.lessonSlug}`,
    })
  }

  // 4. Sugerir simulado quando já cobriu boa parte do edital.
  if (input.nextExam && input.syllabusProgress >= 50) {
    recs.push({
      id: 'proximo-simulado',
      kind: 'dica',
      priority: 'baixa',
      title: `Faça o ${input.nextExam.title}`,
      description: `Você já cobriu ${input.syllabusProgress}% do edital — um simulado ajuda a medir o progresso.`,
      href: '/dashboard/exams',
    })
  }

  // Empty state: nada gerado → incentivo para começar.
  if (recs.length === 0) {
    recs.push({
      id: 'comecar',
      kind: 'dica',
      priority: 'media',
      title: 'Comece seus estudos',
      description:
        'Escolha um módulo, conclua uma lição e responda o quiz para receber recomendações personalizadas.',
      href: '/dashboard/modules',
    })
  }

  return recs
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
    .slice(0, 4)
}
