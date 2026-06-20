import { notFound } from 'next/navigation'

import { QuizEngine } from '@/components/quiz/QuizEngine'
import type { QuizQuestion } from '@/components/quiz/QuestionCard'

interface ExamData {
  slug: string
  title: string
  durationMinutes: number
  questions: QuizQuestion[]
}

// TODO: substituir por dados reais do Supabase (exam + questions + question_options)
const mockExams: Record<string, ExamData> = {
  'simulado-1-aca': {
    slug: 'simulado-1-aca',
    title: 'Simulado 1 - ACA',
    durationMinutes: 180,
    questions: [
      {
        id: 'q1',
        subject: 'Português',
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
        subject: 'Raciocínio Lógico',
        text: 'Se "todo A é B" e "algum B é C", o que se pode concluir com certeza?',
        explanation:
          'Não se pode concluir relação direta entre A e C; as premissas não garantem que algum A seja C.',
        options: [
          { id: 'a', text: 'Todo A é C.', isCorrect: false },
          { id: 'b', text: 'Algum A é C.', isCorrect: false },
          { id: 'c', text: 'Nenhum A é C.', isCorrect: false },
          { id: 'd', text: 'Nada pode ser concluído sobre A e C.', isCorrect: true },
        ],
      },
      {
        id: 'q3',
        subject: 'Administração',
        text: 'No ciclo PDCA, a etapa "C" corresponde a:',
        explanation:
          'No PDCA (Plan, Do, Check, Act), o "C" (Check) é a verificação dos resultados em relação ao planejado.',
        options: [
          { id: 'a', text: 'Planejar.', isCorrect: false },
          { id: 'b', text: 'Executar.', isCorrect: false },
          { id: 'c', text: 'Verificar.', isCorrect: true },
          { id: 'd', text: 'Agir corretivamente.', isCorrect: false },
        ],
      },
      {
        id: 'q4',
        subject: 'Informática',
        text: 'Qual atalho copia o conteúdo selecionado na maioria dos sistemas?',
        explanation: 'Ctrl + C é o atalho padrão para copiar.',
        options: [
          { id: 'a', text: 'Ctrl + V', isCorrect: false },
          { id: 'b', text: 'Ctrl + C', isCorrect: true },
          { id: 'c', text: 'Ctrl + X', isCorrect: false },
          { id: 'd', text: 'Ctrl + Z', isCorrect: false },
        ],
      },
    ],
  },
}

export default function ExamPlayerPage({
  params,
}: {
  params: { examSlug: string }
}) {
  const exam = mockExams[params.examSlug]

  if (!exam) {
    notFound()
  }

  return (
    <QuizEngine
      title={exam.title}
      questions={exam.questions}
      durationMinutes={exam.durationMinutes}
      backHref="/dashboard/exams"
    />
  )
}
