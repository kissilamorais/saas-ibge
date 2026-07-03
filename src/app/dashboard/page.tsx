import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Clock,
  FileCheck2,
  GraduationCap,
  Lock,
  RotateCcw,
} from 'lucide-react'

import { getProfile, hasContentAccess } from '@/lib/auth/session'
import { getDashboardData } from '@/lib/supabase/queries'
import { buildAchievements } from '@/lib/dashboard/achievements'
import { AchievementsRow } from '@/components/dashboard/AchievementsRow'
import { CountdownPanel } from '@/components/dashboard/CountdownPanel'
import { GoalRing } from '@/components/dashboard/GoalRing'
import { GreetingHero } from '@/components/dashboard/GreetingHero'
import { ProgressWidget } from '@/components/dashboard/ProgressWidget'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { RecommendationCard } from '@/components/dashboard/RecommendationCard'
import { StreakCard } from '@/components/dashboard/StreakCard'
import { StudyChart } from '@/components/dashboard/StudyChart'
import { Card } from '@/components/ui/card'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { welcome?: string }
}) {
  const profile = await getProfile()
  const hasAccess = await hasContentAccess()

  // Assinante sem trilha escolhida → onboarding (escolha de cargo) no 1º acesso.
  // Preservamos welcome=1 para o PurchaseTracker (no layout) disparar o Purchase
  // lá no onboarding — senão o param se perderia neste redirect de servidor.
  if (hasAccess && !profile?.target_function) {
    redirect(
      searchParams?.welcome === '1'
        ? '/dashboard/onboarding?welcome=1'
        : '/dashboard/onboarding',
    )
  }

  const data = await getDashboardData()

  // Config do usuário (data da prova + metas) vem do profile; ajustável em
  // /dashboard/settings. Sem data definida → countdown vira "—".
  const dailyGoalHours = profile?.daily_goal_hours ?? 4
  const weeklyGoalHours = profile?.weekly_goal_hours ?? 25
  const examDate = profile?.exam_date ?? null
  const daysUntilExam = examDate
    ? Math.max(
        0,
        Math.ceil((new Date(examDate).getTime() - Date.now()) / 86400000)
      )
    : null
  const examDateLabel = examDate
    ? new Date(`${examDate}T00:00:00`).toLocaleDateString('pt-BR')
    : null
  const {
    totalHoursStudied,
    dailyHoursDone,
    weeklyHoursDone,
    syllabusProgress,
    completedLessons,
    totalLessons,
    moduleProgress,
    studyDays,
    currentStreak,
    bestStreak,
    examsTaken,
    nextLesson,
    nextExam,
    recommendations,
  } = data

  const achievements = buildAchievements({
    syllabusProgress,
    completedLessons,
    currentStreak,
    bestStreak,
    examsTaken,
    totalHoursStudied,
  })

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Foco caloroso de boas-vindas */}
      <GreetingHero
        name={profile?.full_name ?? null}
        foco={
          nextLesson
            ? {
                title: nextLesson.title,
                moduleTitle: nextLesson.moduleTitle,
                href: `/dashboard/${nextLesson.moduleSlug}/${nextLesson.lessonSlug}`,
              }
            : null
        }
      />

      {/* Banner de acesso (aparece enquanto a compra não foi feita) */}
      {!hasAccess && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium">Seu acesso ainda não está liberado</p>
              <p className="text-sm text-muted-foreground">
                Pagamento único de R$97 desbloqueia todas as lições e simulados.
              </p>
            </div>
          </div>
          <Link
            href="/checkout"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Liberar por R$97
          </Link>
        </div>
      )}

      {/* Motivação: contagem regressiva + sequência + metas */}
      <div className="grid gap-4 lg:grid-cols-3">
        <CountdownPanel
          daysUntilExam={daysUntilExam}
          examDateLabel={examDateLabel}
          weeklyHoursDone={weeklyHoursDone}
          weeklyGoalHours={weeklyGoalHours}
        />
        <StreakCard currentStreak={currentStreak} bestStreak={bestStreak} />
        <Card className="flex flex-col justify-center gap-4 p-6">
          <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Metas de estudo
          </h2>
          <GoalRing value={dailyHoursDone} max={dailyGoalHours} label="Hoje" />
          <GoalRing
            value={weeklyHoursDone}
            max={weeklyGoalHours}
            label="Esta semana"
          />
        </Card>
      </div>

      {/* Marcos da jornada */}
      <AchievementsRow achievements={achievements} />

      {/* Progresso por módulo + resumo */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProgressWidget modules={moduleProgress} />
        </div>
        <QuickStats
          title="Resumo"
          items={[
            {
              label: 'Edital concluído',
              value: `${syllabusProgress}%`,
              icon: GraduationCap,
            },
            {
              label: 'Lições concluídas',
              value: `${completedLessons}/${totalLessons}`,
              icon: RotateCcw,
              href: '/dashboard/modules',
            },
            {
              label: 'Horas estudadas',
              value: `${totalHoursStudied}h`,
              icon: Clock,
            },
            {
              label: 'Próximo simulado',
              value: nextExam ? 'Disponível' : 'Tudo feito',
              icon: FileCheck2,
              href: nextExam
                ? `/dashboard/exams/${nextExam.slug}`
                : '/dashboard/exams',
            },
          ]}
        />
      </div>

      {/* Gráfico de horas + recomendações */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StudyChart data={studyDays} dailyGoalHours={dailyGoalHours} />
        <RecommendationCard recommendations={recommendations} />
      </div>
    </div>
  )
}
