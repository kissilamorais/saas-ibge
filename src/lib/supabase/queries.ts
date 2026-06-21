import { createClient } from '@/lib/supabase/server'
import { getProfile, getUser } from '@/lib/auth/session'
import {
  buildRecommendations,
  type ModuleAccuracy,
  type Recommendation,
} from '@/lib/dashboard/recommendations'
import type {
  Exam,
  Lesson,
  Module,
  Question,
  QuestionOption,
  QuestionWithOptions,
} from '@/types'

/**
 * Funções de leitura tipadas para Server Components / Route Handlers.
 * Substituem progressivamente os dados mockados das páginas (busque `// TODO`).
 *
 * NOTA: progresso/horas/metas do usuário dependem de auth (item 3) — as funções
 * abaixo cobrem o conteúdo (módulos, lições, questões, simulados).
 *
 * Os selects aninhados (ex.: `lessons(*)`) são tipados manualmente via cast
 * porque o `Database` de `types.ts` é escrito à mão e não inclui os metadados
 * de `Relationships` que o supabase-js usa para inferir embeds.
 */

// --- Progresso do usuário (leitura) ---

/**
 * Lições concluídas pelo usuário logado. Retorna o conjunto de lesson_ids e a
 * contagem por módulo (para o catálogo). RLS já restringe às linhas do usuário.
 */
export async function getCompletedLessons(): Promise<{
  lessonIds: Set<string>
  byModule: Map<string, number>
}> {
  const supabase = createClient()
  const user = await getUser()
  const lessonIds = new Set<string>()
  const byModule = new Map<string, number>()
  if (!user) return { lessonIds, byModule }

  const { data, error } = await supabase
    .from('user_progress')
    .select('lesson_id, module_id')
    .eq('completed', true)

  if (error) throw error

  for (const r of (data ?? []) as {
    lesson_id: string | null
    module_id: string | null
  }[]) {
    if (r.lesson_id) lessonIds.add(r.lesson_id)
    if (r.module_id) byModule.set(r.module_id, (byModule.get(r.module_id) ?? 0) + 1)
  }
  return { lessonIds, byModule }
}

/**
 * Estatísticas de simulados do usuário: nº de tentativas e nota da última
 * tentativa (%), por exam_id.
 */
export async function getUserExamStats(): Promise<
  Map<string, { attempts: number; lastScore: number | null }>
> {
  const supabase = createClient()
  const user = await getUser()
  const map = new Map<string, { attempts: number; lastScore: number | null }>()
  if (!user) return map

  const { data, error } = await supabase
    .from('user_exam_results')
    .select('exam_id, percentage, completed_at')
    .order('completed_at', { ascending: true })

  if (error) throw error

  for (const r of (data ?? []) as {
    exam_id: string
    percentage: number | null
    completed_at: string
  }[]) {
    const cur = map.get(r.exam_id) ?? { attempts: 0, lastScore: null }
    cur.attempts += 1
    cur.lastScore = r.percentage ?? cur.lastScore // ordenado asc → última vence
    map.set(r.exam_id, cur)
  }
  return map
}

/**
 * Aproveitamento do usuário por módulo (acertos/total nas respostas dadas).
 * Alimenta as recomendações de "fraqueza". RLS restringe às respostas do usuário.
 */
export async function getModuleAccuracy(): Promise<ModuleAccuracy[]> {
  const supabase = createClient()
  const user = await getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('user_answers')
    .select('is_correct, questions(modules(slug, title))')
  if (error) throw error

  const byModule = new Map<string, ModuleAccuracy>()
  for (const r of (data ?? []) as unknown as {
    is_correct: boolean | null
    questions: { modules: { slug: string; title: string } | null } | null
  }[]) {
    const mod = r.questions?.modules
    if (!mod) continue
    const cur =
      byModule.get(mod.slug) ??
      ({ slug: mod.slug, title: mod.title, correct: 0, total: 0 } as ModuleAccuracy)
    cur.total += 1
    if (r.is_correct) cur.correct += 1
    byModule.set(mod.slug, cur)
  }
  return Array.from(byModule.values())
}

export interface DashboardData {
  syllabusProgress: number
  completedLessons: number
  totalLessons: number
  totalHoursStudied: number
  dailyHoursDone: number
  weeklyHoursDone: number
  moduleProgress: {
    id: string
    name: string
    completedLessons: number
    totalLessons: number
  }[]
  studyDays: { label: string; hours: number }[]
  nextLesson: {
    moduleSlug: string
    moduleTitle: string
    lessonSlug: string
    title: string
  } | null
  nextExam: { slug: string; title: string } | null
  recommendations: Recommendation[]
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const round1 = (n: number) => Math.round(n * 10) / 10

/** Agrega tudo que a dashboard precisa (progresso, horas, próximos passos). */
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = createClient()
  const user = await getUser()

  // Tudo que a dashboard precisa é independente entre si → busca em paralelo
  // (evita o waterfall: módulos → progresso → sessões → simulados).
  const sessionsPromise = user
    ? supabase.from('study_sessions').select('duration_minutes, started_at')
    : Promise.resolve({ data: [], error: null } as const)

  const [modsRes, completed, sessionsRes, exams, stats, moduleAccuracy, profile] =
    await Promise.all([
      supabase
        .from('modules')
        .select('id, slug, title, lessons(id, slug, title, order_index)')
        .order('order_index', { ascending: true })
        .order('order_index', { foreignTable: 'lessons', ascending: true }),
      getCompletedLessons(),
      sessionsPromise,
      getExams(),
      getUserExamStats(),
      getModuleAccuracy(),
      getProfile(),
    ])

  const weeklyGoalHours = profile?.weekly_goal_hours ?? 25

  if (modsRes.error) throw modsRes.error

  const mods = (modsRes.data ?? []) as unknown as {
    id: string
    slug: string
    title: string
    lessons:
      | { id: string; slug: string; title: string; order_index: number | null }[]
      | null
  }[]

  const { lessonIds } = completed

  let totalLessons = 0
  let completedLessons = 0
  const moduleProgress = mods.map((m) => {
    const lessons = m.lessons ?? []
    const done = lessons.filter((l) => lessonIds.has(l.id)).length
    totalLessons += lessons.length
    completedLessons += done
    return {
      id: m.id,
      name: m.title,
      completedLessons: done,
      totalLessons: lessons.length,
    }
  })
  const syllabusProgress =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  let nextLesson: DashboardData['nextLesson'] = null
  for (const m of mods) {
    const found = (m.lessons ?? []).find((l) => !lessonIds.has(l.id))
    if (found) {
      nextLesson = {
        moduleSlug: m.slug,
        moduleTitle: m.title,
        lessonSlug: found.slug,
        title: found.title,
      }
      break
    }
  }

  // Horas de estudo (study_sessions) — total, hoje, semana e 7 dias.
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const keyFor = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
  const dayKeys: string[] = []
  const studyDays: { label: string; hours: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday.getTime() - i * 86400000)
    dayKeys.push(keyFor(d))
    studyDays.push({ label: DAY_LABELS[d.getDay()], hours: 0 })
  }
  const weekStart = new Date(startOfToday.getTime() - 6 * 86400000)
  const minutesByDay = new Map<string, number>()
  let totalMin = 0
  let dailyMin = 0
  let weeklyMin = 0

  if (sessionsRes.error) throw sessionsRes.error
  for (const s of (sessionsRes.data ?? []) as {
    duration_minutes: number | null
    started_at: string
  }[]) {
    const mins = s.duration_minutes ?? 0
    const d = new Date(s.started_at)
    totalMin += mins
    if (d >= startOfToday) dailyMin += mins
    if (d >= weekStart) weeklyMin += mins
    const k = keyFor(d)
    minutesByDay.set(k, (minutesByDay.get(k) ?? 0) + mins)
  }
  studyDays.forEach((day, i) => {
    day.hours = round1((minutesByDay.get(dayKeys[i]) ?? 0) / 60)
  })

  // Próximo simulado: primeiro ainda não realizado.
  let nextExam: DashboardData['nextExam'] = null
  for (const e of exams) {
    if (!stats.get(e.id)) {
      nextExam = { slug: e.slug, title: e.title }
      break
    }
  }

  const weeklyHoursDone = round1(weeklyMin / 60)

  const recommendations = buildRecommendations({
    moduleAccuracy,
    weeklyHoursDone,
    weeklyGoalHours,
    syllabusProgress,
    nextLesson: nextLesson
      ? {
          moduleSlug: nextLesson.moduleSlug,
          lessonSlug: nextLesson.lessonSlug,
          title: nextLesson.title,
        }
      : null,
    nextExam,
  })

  return {
    syllabusProgress,
    completedLessons,
    totalLessons,
    totalHoursStudied: round1(totalMin / 60),
    dailyHoursDone: round1(dailyMin / 60),
    weeklyHoursDone,
    moduleProgress,
    studyDays,
    nextLesson,
    nextExam,
    recommendations,
  }
}

// --- Módulos ---

export async function getModules(): Promise<Module[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getModulesWithQuestionCount(): Promise<
  (Module & { totalQuestions: number })[]
> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('modules')
    .select('*, questions(count)')
    .order('order_index', { ascending: true })

  if (error) throw error

  const rows = (data ?? []) as unknown as (Module & {
    questions: { count: number }[] | null
  })[]

  return rows.map(({ questions, ...mod }) => ({
    ...mod,
    totalQuestions: questions?.[0]?.count ?? 0,
  }))
}

export async function getModulesWithLessonCount(): Promise<
  (Module & { totalLessons: number })[]
> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('modules')
    .select('*, lessons(count)')
    .order('order_index', { ascending: true })

  if (error) throw error

  const rows = (data ?? []) as unknown as (Module & {
    lessons: { count: number }[] | null
  })[]

  return rows.map(({ lessons, ...mod }) => ({
    ...mod,
    totalLessons: lessons?.[0]?.count ?? 0,
  }))
}

export async function getModuleBySlug(
  slug: string
): Promise<(Module & { lessons: Lesson[] }) | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('modules')
    .select('*, lessons(*)')
    .eq('slug', slug)
    .order('order_index', { foreignTable: 'lessons', ascending: true })
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as unknown as Module & { lessons: Lesson[] | null }
  return { ...row, lessons: row.lessons ?? [] }
}

// --- Lições ---

export async function getLessonBySlug(
  moduleSlug: string,
  lessonSlug: string
): Promise<(Lesson & { questions: QuestionWithOptions[] }) | null> {
  const supabase = createClient()

  // Resolve o módulo primeiro para garantir que a lição pertence a ele
  const { data: moduleData, error: moduleError } = await supabase
    .from('modules')
    .select('id')
    .eq('slug', moduleSlug)
    .maybeSingle()

  if (moduleError) throw moduleError
  if (!moduleData) return null

  const moduleId = (moduleData as unknown as { id: string }).id

  const { data, error } = await supabase
    .from('lessons')
    .select('*, questions(*, question_options(*))')
    .eq('slug', lessonSlug)
    .eq('module_id', moduleId)
    .order('order_index', { foreignTable: 'questions', ascending: true })
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as unknown as Lesson & {
    questions: (Question & { question_options: QuestionOption[] | null })[] | null
  }

  const questions: QuestionWithOptions[] = (row.questions ?? []).map((q) => ({
    ...q,
    options: q.question_options ?? [],
  }))

  return { ...row, questions }
}

/**
 * Amostra aleatória de questões de um módulo, para o quiz de prática da lição.
 * (As questões do banco têm `module_id`, não `lesson_id` — ver nota no seed.)
 * Busca os ids do módulo, embaralha e carrega só as escolhidas com opções.
 */
export async function getModuleQuizSample(
  moduleId: string,
  limit = 5
): Promise<QuestionWithOptions[]> {
  const supabase = createClient()

  const { data: idRows, error: idError } = await supabase
    .from('questions')
    .select('id')
    .eq('module_id', moduleId)

  if (idError) throw idError

  const pool = (idRows ?? []).map((r) => (r as { id: string }).id)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const pick = pool.slice(0, limit)
  if (pick.length === 0) return []

  const { data, error } = await supabase
    .from('questions')
    .select('*, question_options(*)')
    .in('id', pick)

  if (error) throw error

  const rows = (data ?? []) as unknown as (Question & {
    question_options: QuestionOption[] | null
  })[]

  return rows.map((q) => ({ ...q, options: q.question_options ?? [] }))
}

// --- Simulados ---

export async function getExams(): Promise<Exam[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getExamBySlug(slug: string): Promise<Exam | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Carrega um simulado com suas questões (via tabela de junção `exam_questions`,
 * adicionada na migration 0001). As questões vêm na ordem de `order_index` da
 * junção. Acesso depende de assinatura ativa (RLS).
 */
export type ExamQuestionWithModule = QuestionWithOptions & {
  moduleTitle: string | null
}

export async function getExamWithQuestions(
  slug: string
): Promise<(Exam & { questions: ExamQuestionWithModule[] }) | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exams')
    .select(
      '*, exam_questions(order_index, questions(*, question_options(*), modules(title)))'
    )
    .eq('slug', slug)
    .order('order_index', { foreignTable: 'exam_questions', ascending: true })
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  type EmbeddedQuestion = Question & {
    question_options: QuestionOption[] | null
    modules: { title: string } | null
  }

  const row = data as unknown as Exam & {
    exam_questions:
      | { order_index: number | null; questions: EmbeddedQuestion | null }[]
      | null
  }

  const questions: ExamQuestionWithModule[] = (row.exam_questions ?? [])
    .map((eq) => eq.questions)
    .filter((q): q is EmbeddedQuestion => q !== null)
    .map((q) => ({
      ...q,
      options: q.question_options ?? [],
      moduleTitle: q.modules?.title ?? null,
    }))

  const { exam_questions: _omit, ...exam } = row
  return { ...(exam as Exam), questions }
}
