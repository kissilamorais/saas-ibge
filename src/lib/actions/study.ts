'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types'

type ExamResultInsert =
  Database['public']['Tables']['user_exam_results']['Insert']
type AnswerInsert = Database['public']['Tables']['user_answers']['Insert']
type ProgressInsert = Database['public']['Tables']['user_progress']['Insert']
type SessionInsert = Database['public']['Tables']['study_sessions']['Insert']

/**
 * Server Actions de tracking (escrita). Rodam com a sessão do usuário (cookies),
 * então o RLS garante que cada linha pertence a quem está logado (user_id = auth.uid()).
 */

export interface SubmitExamInput {
  examId: string
  totalQuestions: number
  timeSpentSeconds: number
  /** questionId -> optionId selecionado (apenas as respondidas) */
  answers: { questionId: string; optionId: string }[]
}

type ActionResult = { ok: true } | { ok: false; error: string }

const PASS_PERCENT = 70

export async function submitExamResult(
  input: SubmitExamInput
): Promise<ActionResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  // Correção é feita no servidor (não confia no cliente): busca a opção correta
  // de cada questão respondida.
  const questionIds = input.answers.map((a) => a.questionId)
  const correctByQuestion = new Map<string, string>()
  if (questionIds.length > 0) {
    const { data, error } = await supabase
      .from('question_options')
      .select('question_id, id')
      .eq('is_correct', true)
      .in('question_id', questionIds)
    if (error) return { ok: false, error: error.message }
    for (const r of (data ?? []) as { question_id: string; id: string }[]) {
      correctByQuestion.set(r.question_id, r.id)
    }
  }

  const correctCount = input.answers.reduce(
    (n, a) => (correctByQuestion.get(a.questionId) === a.optionId ? n + 1 : n),
    0
  )
  const total = input.totalQuestions || input.answers.length
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0
  const completedAt = new Date()
  const startedAt = new Date(
    completedAt.getTime() - input.timeSpentSeconds * 1000
  )

  const resultRow: ExamResultInsert = {
    user_id: user.id,
    exam_id: input.examId,
    score: correctCount,
    total_questions: total,
    percentage,
    passed: percentage >= PASS_PERCENT,
    time_spent_minutes: Math.round(input.timeSpentSeconds / 60),
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
  }
  // cast: o Database escrito à mão não satisfaz o GenericSchema do supabase-js
  // para inserts (param vira never[]); o payload acima já é tipado por Insert.
  const { error: resErr } = await supabase
    .from('user_exam_results')
    .insert(resultRow as never)
  if (resErr) return { ok: false, error: resErr.message }

  if (input.answers.length > 0) {
    const rows: AnswerInsert[] = input.answers.map((a) => ({
      user_id: user.id,
      question_id: a.questionId,
      selected_option_id: a.optionId,
      is_correct: correctByQuestion.get(a.questionId) === a.optionId,
    }))
    const { error: ansErr } = await supabase
      .from('user_answers')
      .insert(rows as never)
    if (ansErr) return { ok: false, error: ansErr.message }
  }

  // Sessão de estudo (best-effort): tempo do simulado conta como horas estudadas.
  const examSession: SessionInsert = {
    user_id: user.id,
    module_id: null,
    lesson_id: null,
    started_at: startedAt.toISOString(),
    ended_at: completedAt.toISOString(),
    duration_minutes: Math.round(input.timeSpentSeconds / 60),
  }
  await supabase.from('study_sessions').insert(examSession as never)

  revalidatePath('/dashboard/exams')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function markLessonComplete(
  lessonId: string,
  moduleId: string,
  moduleSlug: string,
  durationMinutes = 0
): Promise<ActionResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  // Só registra sessão de estudo na 1ª vez que a lição é concluída.
  const { data: existing } = await supabase
    .from('user_progress')
    .select('completed')
    .eq('user_id', user.id)
    .eq('lesson_id', lessonId)
    .maybeSingle()
  const alreadyDone = (existing as { completed: boolean } | null)?.completed === true

  const now = new Date().toISOString()
  const progressRow: ProgressInsert = {
    user_id: user.id,
    lesson_id: lessonId,
    module_id: moduleId,
    completed: true,
    completion_percentage: 100,
    last_accessed_at: now,
    completed_at: now,
  }
  const { error } = await supabase
    .from('user_progress')
    .upsert(progressRow as never, { onConflict: 'user_id,lesson_id' })
  if (error) return { ok: false, error: error.message }

  if (!alreadyDone && durationMinutes > 0) {
    const lessonSession: SessionInsert = {
      user_id: user.id,
      module_id: moduleId,
      lesson_id: lessonId,
      started_at: now,
      ended_at: now,
      duration_minutes: durationMinutes,
    }
    await supabase.from('study_sessions').insert(lessonSession as never)
  }

  revalidatePath('/dashboard/modules')
  revalidatePath(`/dashboard/modules/${moduleSlug}`)
  revalidatePath('/dashboard')
  return { ok: true }
}
