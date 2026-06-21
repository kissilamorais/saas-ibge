'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/session'
import { reportError } from '@/lib/observability/log'
import type { Database } from '@/types'

type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

type ActionResult = { ok: true } | { ok: false; error: string }

const studyConfigSchema = z.object({
  // '' (input vazio) vira null = sem data definida
  examDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .or(z.literal('').transform(() => null)),
  dailyGoalHours: z.coerce.number().int().min(1).max(24),
  weeklyGoalHours: z.coerce.number().int().min(1).max(168),
})

export type StudyConfigInput = {
  examDate: string
  dailyGoalHours: number | string
  weeklyGoalHours: number | string
}

/**
 * Atualiza a configuração de estudo do próprio usuário (data da prova + metas).
 * RLS garante que o update só afeta o profile do usuário logado.
 */
export async function updateStudyConfig(
  input: StudyConfigInput
): Promise<ActionResult> {
  const parsed = studyConfigSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid_input' }
  const { examDate, dailyGoalHours, weeklyGoalHours } = parsed.data

  if (weeklyGoalHours < dailyGoalHours) {
    return { ok: false, error: 'weekly_lt_daily' }
  }

  const supabase = createClient()
  const user = await getUser()
  if (!user) return { ok: false, error: 'not_authenticated' }

  try {
    const payload: ProfileUpdate = {
      exam_date: examDate,
      daily_goal_hours: dailyGoalHours,
      weekly_goal_hours: weeklyGoalHours,
    }
    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
    if (error) return { ok: false, error: error.message }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')
    return { ok: true }
  } catch (error) {
    reportError('profile.updateStudyConfig', error)
    return { ok: false, error: 'unexpected_error' }
  }
}
