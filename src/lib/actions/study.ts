'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/session'
import { reportError } from '@/lib/observability/log'
import { computeScore, PASS_PERCENT } from '@/lib/study/scoring'
import type { Database } from '@/types'

type ExamResultInsert =
  Database['public']['Tables']['user_exam_results']['Insert']
type AnswerInsert = Database['public']['Tables']['user_answers']['Insert']
type ProgressInsert = Database['public']['Tables']['user_progress']['Insert']
type SessionInsert = Database['public']['Tables']['study_sessions']['Insert']

/**
 * Server Actions de tracking (escrita). Rodam com a sessão do usuário (cookies),
 * então o RLS garante que cada linha pertence a quem está logado (user_id = auth.uid()).
 * Toda entrada é validada com Zod (não confiar no shape vindo do cliente).
 */

// --- Schemas de validação ---

const submitExamSchema = z.object({
  examId: z.string().uuid(),
  timeSpentSeconds: z.number().int().nonnegative().max(86_400), // <= 24h
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        optionId: z.string().uuid(),
      })
    )
    .max(500),
})

export type SubmitExamInput = z.infer<typeof submitExamSchema>

/** Correção devolvida ao cliente para montar a tela de resultado/revisão. */
export interface ExamCorrection {
  score: number
  total: number
  percentage: number
  passed: boolean
  /** questionId -> id da opção correta (gabarito, só após enviar). */
  correctByQuestion: Record<string, string>
}

type SubmitExamResult =
  | { ok: true; result: ExamCorrection }
  | { ok: false; error: string }

type ActionResult = { ok: true } | { ok: false; error: string }

export async function submitExamResult(
  rawInput: SubmitExamInput
): Promise<SubmitExamResult> {
  const parsed = submitExamSchema.safeParse(rawInput)
  if (!parsed.success) return { ok: false, error: 'invalid_input' }
  const input = parsed.data

  const supabase = createClient()
  const user = await getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  try {
    // Total e gabarito são AUTORITATIVOS (banco), não vêm do cliente. Buscamos
    // todas as questões do simulado para (a) ter o total real e (b) montar o
    // gabarito completo para a revisão — inclusive das não respondidas.
    const { data: eqRows, error: eqErr } = await supabase
      .from('exam_questions')
      .select('question_id')
      .eq('exam_id', input.examId)
    if (eqErr) return { ok: false, error: eqErr.message }

    const examQuestionIds = (eqRows ?? []).map(
      (r) => (r as { question_id: string }).question_id
    )
    const total = examQuestionIds.length
    if (total === 0) return { ok: false, error: 'exam_without_questions' }

    const correctByQuestion = new Map<string, string>()
    const { data: optRows, error: optErr } = await supabase
      .from('question_options')
      .select('question_id, id')
      .eq('is_correct', true)
      .in('question_id', examQuestionIds)
    if (optErr) return { ok: false, error: optErr.message }
    for (const r of (optRows ?? []) as { question_id: string; id: string }[]) {
      correctByQuestion.set(r.question_id, r.id)
    }

    // Só consideramos respostas a questões que pertencem a este simulado.
    const validAnswers = input.answers.filter((a) =>
      examQuestionIds.includes(a.questionId)
    )

    const { score, percentage, passed } = computeScore(
      validAnswers,
      correctByQuestion,
      total
    )

    const completedAt = new Date()
    const startedAt = new Date(
      completedAt.getTime() - input.timeSpentSeconds * 1000
    )

    const resultRow: ExamResultInsert = {
      user_id: user.id,
      exam_id: input.examId,
      score,
      total_questions: total,
      percentage,
      passed,
      time_spent_minutes: Math.round(input.timeSpentSeconds / 60),
      started_at: startedAt.toISOString(),
      completed_at: completedAt.toISOString(),
    }
    const { error: resErr } = await supabase
      .from('user_exam_results')
      .insert(resultRow)
    if (resErr) return { ok: false, error: resErr.message }

    if (validAnswers.length > 0) {
      const rows: AnswerInsert[] = validAnswers.map((a) => ({
        user_id: user.id,
        question_id: a.questionId,
        selected_option_id: a.optionId,
        is_correct: correctByQuestion.get(a.questionId) === a.optionId,
      }))
      // upsert: mantém apenas a última resposta do usuário por questão
      // (evita crescimento ilimitado de user_answers ao refazer simulados).
      const { error: ansErr } = await supabase
        .from('user_answers')
        .upsert(rows, { onConflict: 'user_id,question_id' })
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
    const { error: sessErr } = await supabase
      .from('study_sessions')
      .insert(examSession)
    if (sessErr) reportError('study.submitExamResult.session', sessErr)

    revalidatePath('/dashboard/exams')
    revalidatePath('/dashboard')

    return {
      ok: true,
      result: {
        score,
        total,
        percentage,
        passed,
        correctByQuestion: Object.fromEntries(correctByQuestion),
      },
    }
  } catch (error) {
    reportError('study.submitExamResult', error, { examId: input.examId })
    return { ok: false, error: 'unexpected_error' }
  }
}

const markLessonSchema = z.object({
  lessonId: z.string().uuid(),
  moduleId: z.string().uuid(),
  moduleSlug: z.string().min(1).max(200),
  durationMinutes: z.number().int().nonnegative().max(100_000),
})

export async function markLessonComplete(
  lessonId: string,
  moduleId: string,
  moduleSlug: string,
  durationMinutes = 0
): Promise<ActionResult> {
  const parsed = markLessonSchema.safeParse({
    lessonId,
    moduleId,
    moduleSlug,
    durationMinutes,
  })
  if (!parsed.success) return { ok: false, error: 'invalid_input' }

  const supabase = createClient()
  const user = await getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  try {
    // Só registra sessão de estudo na 1ª vez que a lição é concluída.
    const { data: existing } = await supabase
      .from('user_progress')
      .select('completed')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle()
    const alreadyDone =
      (existing as { completed: boolean } | null)?.completed === true

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
      .upsert(progressRow, { onConflict: 'user_id,lesson_id' })
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
      const { error: sessErr } = await supabase
        .from('study_sessions')
        .insert(lessonSession)
      if (sessErr) reportError('study.markLessonComplete.session', sessErr)
    }

    revalidatePath('/dashboard/modules')
    revalidatePath(`/dashboard/modules/${moduleSlug}`)
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (error) {
    reportError('study.markLessonComplete', error, { lessonId })
    return { ok: false, error: 'unexpected_error' }
  }
}

export { PASS_PERCENT }
