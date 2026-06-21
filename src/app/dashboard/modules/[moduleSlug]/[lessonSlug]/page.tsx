import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requireActiveSubscription } from '@/lib/auth/session'
import {
  getCompletedLessons,
  getLessonBySlug,
  getModuleBySlug,
  getModuleQuizSample,
} from '@/lib/supabase/queries'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'

import { LessonViewer, type LessonData } from '@/components/lessons/LessonViewer'

interface LessonNav {
  slug: string
  title: string
}

interface FullLesson extends LessonData {
  slug: string
  moduleSlug: string
  moduleTitle: string
  prev: LessonNav | null
  next: LessonNav | null
}

export default async function LessonPage({
  params,
}: {
  params: { moduleSlug: string; lessonSlug: string }
}) {
  await requireActiveSubscription()

  const { moduleSlug } = params

  // Módulo (título + navegação entre lições) e lição (conteúdo + questões).
  const [moduleData, lessonData, progress] = await Promise.all([
    getModuleBySlug(moduleSlug),
    getLessonBySlug(moduleSlug, params.lessonSlug),
    getCompletedLessons(),
  ])

  if (!moduleData || !lessonData) {
    notFound()
  }

  const siblings = moduleData.lessons
  const idx = siblings.findIndex((l) => l.slug === params.lessonSlug)
  const prev =
    idx > 0 ? { slug: siblings[idx - 1].slug, title: siblings[idx - 1].title } : null
  const next =
    idx >= 0 && idx < siblings.length - 1
      ? { slug: siblings[idx + 1].slug, title: siblings[idx + 1].title }
      : null

  // Questões da lição: usa as ligadas a ela; se não houver (banco é por módulo),
  // cai para uma amostra de prática do módulo (ver getModuleQuizSample).
  const quizSource =
    lessonData.questions.length > 0
      ? lessonData.questions
      : await getModuleQuizSample(moduleData.id, 5)

  const lesson: FullLesson = {
    slug: lessonData.slug,
    moduleSlug,
    moduleTitle: moduleData.title,
    title: lessonData.title,
    durationMinutes: lessonData.duration_minutes ?? 0,
    content: lessonData.content ?? '',
    quiz: quizSource.map((q) => ({
      id: q.id,
      text: q.question_text,
      explanation: q.explanation ?? '',
      options: (q.options ?? []).map((o) => ({
        id: o.id,
        text: o.text,
        isCorrect: Boolean(o.is_correct),
      })),
    })),
    prev,
    next,
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-8">
      {/* Cabeçalho */}
      <div className="space-y-3">
        <Link
          href={`/dashboard/modules/${moduleSlug}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {lesson.moduleTitle}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
      </div>

      {/* Conteúdo + quiz */}
      <LessonViewer
        lesson={lesson}
        completion={{
          lessonId: lessonData.id,
          moduleId: moduleData.id,
          moduleSlug,
          completed: progress.lessonIds.has(lessonData.id),
        }}
      />

      {/* Navegação entre lições */}
      <nav className="flex items-center justify-between gap-4 border-t pt-6">
        {lesson.prev ? (
          <Link
            href={`/dashboard/modules/${moduleSlug}/${lesson.prev.slug}`}
            className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-left">
              <span className="block text-xs">Anterior</span>
              <span className="font-medium">{lesson.prev.title}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}

        {lesson.next ? (
          <Link
            href={`/dashboard/modules/${moduleSlug}/${lesson.next.slug}`}
            className="group flex items-center gap-2 text-right text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>
              <span className="block text-xs">Próxima</span>
              <span className="font-medium">{lesson.next.title}</span>
            </span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  )
}
