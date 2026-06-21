import { notFound } from 'next/navigation'

import { requireTargetFunction } from '@/lib/auth/session'
import { getExamWithQuestions } from '@/lib/supabase/queries'

import { QuizEngine } from '@/components/quiz/QuizEngine'
import type { QuizQuestion } from '@/components/quiz/QuestionCard'

export default async function ExamPlayerPage({
  params,
}: {
  params: { examSlug: string }
}) {
  const profile = await requireTargetFunction()

  const exam = await getExamWithQuestions(params.examSlug)

  // 404 se o simulado é de outra trilha (function_code nulo = genérico, liberado).
  if (
    !exam ||
    (exam.function_code && exam.function_code !== profile.target_function)
  ) {
    notFound()
  }

  // Importante: NÃO enviamos `is_correct` ao cliente no simulado — o gabarito
  // só chega na resposta do servidor após enviar (ver submitExamResult). Isso
  // impede ler as respostas pelo DevTools/network antes de responder.
  const questions: QuizQuestion[] = exam.questions.map((q) => ({
    id: q.id,
    text: q.question_text,
    explanation: q.explanation ?? '',
    subject: q.moduleTitle ?? undefined,
    options: (q.options ?? []).map((o) => ({
      id: o.id,
      text: o.text,
    })),
  }))

  return (
    <QuizEngine
      examId={exam.id}
      title={exam.title}
      questions={questions}
      durationMinutes={exam.duration_minutes ?? 0}
      backHref="/dashboard/exams"
    />
  )
}
