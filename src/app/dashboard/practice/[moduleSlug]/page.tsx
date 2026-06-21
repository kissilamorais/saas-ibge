import { notFound } from 'next/navigation'

import { requireTargetFunction } from '@/lib/auth/session'
import { getModuleBySlug, getModuleQuizSample } from '@/lib/supabase/queries'
import { PracticeQuiz } from '@/components/quiz/PracticeQuiz'
import type { QuizQuestion } from '@/components/quiz/QuestionCard'

const PRACTICE_SIZE = 10

export default async function PracticeModulePage({
  params,
}: {
  params: { moduleSlug: string }
}) {
  const profile = await requireTargetFunction()

  const moduleData = await getModuleBySlug(params.moduleSlug)
  if (!moduleData || !moduleData.functions.includes(profile.target_function!)) {
    notFound()
  }

  const sample = await getModuleQuizSample(moduleData.id, PRACTICE_SIZE)

  // Prática (não é simulado): feedback imediato com gabarito local é aceitável
  // — mesmo padrão da lição. As respostas são registradas via Server Action.
  const questions: QuizQuestion[] = sample.map((q) => ({
    id: q.id,
    text: q.question_text,
    explanation: q.explanation ?? '',
    subject: moduleData.title,
    options: (q.options ?? []).map((o) => ({
      id: o.id,
      text: o.text,
      isCorrect: Boolean(o.is_correct),
    })),
  }))

  return (
    <PracticeQuiz
      moduleTitle={moduleData.title}
      questions={questions}
      backHref="/dashboard/practice"
    />
  )
}
