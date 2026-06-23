/**
 * Marcos (conquistas) do candidato, derivados de dados que já temos — sem
 * tabela nova. Cada marco é binário (conquistado ou não) e a régua é honesta:
 * só "acende" (dourado) quando o aluno realmente cumpriu. A cor de conquista é
 * recompensa, não enfeite.
 */
export interface Achievement {
  id: string
  /** Rótulo curto e maduro, ex: "1ª semana". */
  label: string
  /** Texto de apoio mostrado no hover/legenda. */
  hint: string
  unlocked: boolean
}

export interface AchievementInput {
  syllabusProgress: number
  completedLessons: number
  currentStreak: number
  bestStreak: number
  examsTaken: number
  totalHoursStudied: number
}

export function buildAchievements(input: AchievementInput): Achievement[] {
  const {
    syllabusProgress,
    completedLessons,
    bestStreak,
    examsTaken,
    totalHoursStudied,
  } = input

  return [
    {
      id: 'first-lesson',
      label: 'Primeira lição',
      hint: 'Você começou — o passo mais difícil.',
      unlocked: completedLessons >= 1,
    },
    {
      id: 'first-week',
      label: '1ª semana',
      hint: '7 dias seguidos de estudo. Constância vence.',
      unlocked: bestStreak >= 7,
    },
    {
      id: 'syllabus-25',
      label: '25% do edital',
      hint: 'Um quarto do conteúdo dominado.',
      unlocked: syllabusProgress >= 25,
    },
    {
      id: 'syllabus-50',
      label: 'Metade do edital',
      hint: 'Você passou da metade. Pé na estrada.',
      unlocked: syllabusProgress >= 50,
    },
    {
      id: 'syllabus-75',
      label: '75% do edital',
      hint: 'Reta final do conteúdo à vista.',
      unlocked: syllabusProgress >= 75,
    },
    {
      id: 'first-exam',
      label: '1º simulado',
      hint: 'Você encarou uma prova completa.',
      unlocked: examsTaken >= 1,
    },
    {
      id: 'three-exams',
      label: '3 simulados',
      hint: 'Ritmo de prova ganhando forma.',
      unlocked: examsTaken >= 3,
    },
    {
      id: 'hours-50',
      label: '50 horas',
      hint: '50 horas de estudo acumuladas.',
      unlocked: totalHoursStudied >= 50,
    },
  ]
}
