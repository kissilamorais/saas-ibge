import Link from 'next/link'
import { notFound } from 'next/navigation'
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

// TODO: substituir por dados reais do Supabase (lesson.content, questions, options, progress)
const mockLessons: Record<string, FullLesson> = {
  'concordancia-verbal': {
    slug: 'concordancia-verbal',
    moduleSlug: 'portugues',
    moduleTitle: 'Português',
    title: 'Concordância Verbal',
    durationMinutes: 40,
    content: `A concordância verbal é a relação de harmonia entre o verbo e o seu sujeito. O verbo concorda com o sujeito em número (singular ou plural) e pessoa (primeira, segunda ou terceira).
Regra geral: o verbo concorda com o núcleo do sujeito. Exemplo: "Os alunos estudaram para a prova" — o verbo "estudaram" está no plural porque o núcleo do sujeito ("alunos") está no plural.
Sujeito composto: quando o sujeito é composto e vem antes do verbo, o verbo vai para o plural. Exemplo: "João e Maria viajaram".
Casos especiais: com a expressão "um dos que", o verbo geralmente vai para o plural. Já com o pronome "que", o verbo concorda com o antecedente. Atenção também a sujeitos coletivos e a porcentagens, que pedem análise cuidadosa do contexto.`,
    quiz: [
      {
        id: 'q1',
        text: 'Assinale a alternativa em que a concordância verbal está correta.',
        explanation:
          'Com sujeito composto anteposto ao verbo, o verbo vai para o plural: "O diretor e o professor chegaram".',
        options: [
          { id: 'a', text: 'O diretor e o professor chegou cedo.', isCorrect: false },
          { id: 'b', text: 'O diretor e o professor chegaram cedo.', isCorrect: true },
          { id: 'c', text: 'Os diretor e o professor chegou cedo.', isCorrect: false },
          { id: 'd', text: 'O diretor e os professor chegaram cedo.', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        text: 'Em "Fazem dois anos que ele partiu", há erro de concordância. A forma correta é:',
        explanation:
          'O verbo "fazer" indicando tempo decorrido é impessoal e fica sempre no singular: "Faz dois anos que ele partiu".',
        options: [
          { id: 'a', text: 'Fazem dois anos que ele partiu.', isCorrect: false },
          { id: 'b', text: 'Faz dois anos que ele partiu.', isCorrect: true },
          { id: 'c', text: 'Faziam dois anos que ele partiu.', isCorrect: false },
          { id: 'd', text: 'Fazem dois ano que ele partiu.', isCorrect: false },
        ],
      },
    ],
    prev: { slug: 'acentuacao', title: 'Acentuação Gráfica' },
    next: { slug: 'concordancia-nominal', title: 'Concordância Nominal' },
  },
}

export default function LessonPage({
  params,
}: {
  params: { moduleSlug: string; lessonSlug: string }
}) {
  const lesson = mockLessons[params.lessonSlug]

  if (!lesson || lesson.moduleSlug !== params.moduleSlug) {
    notFound()
  }

  const { moduleSlug } = params

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
      <LessonViewer lesson={lesson} />

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
