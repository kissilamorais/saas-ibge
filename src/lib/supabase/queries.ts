import { createClient } from '@/lib/supabase/server'
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

// TODO (schema): não há vínculo entre `exams` e `questions` (falta `exam_id`
// em questions OU uma tabela `exam_questions`). Sem isso, não dá para carregar
// as questões de um simulado. Decidir no passo do seed e então implementar
// getExamWithQuestions(slug). Ver nota no CLAUDE.md.
