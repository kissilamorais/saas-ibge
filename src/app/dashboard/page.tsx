import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  Clock,
  FileCheck2,
  GraduationCap,
  Lock,
  RotateCcw,
  Target,
} from 'lucide-react'

import { getProfile, hasContentAccess } from '@/lib/auth/session'
import { getDashboardData } from '@/lib/supabase/queries'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { ProgressWidget } from '@/components/dashboard/ProgressWidget'
import { RecommendationCard } from '@/components/dashboard/RecommendationCard'
import { StudyChart } from '@/components/dashboard/StudyChart'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export default async function DashboardPage() {
  const profile = await getProfile()
  const hasAccess = await hasContentAccess()

  // Assinante sem trilha escolhida → onboarding (escolha de cargo) no 1º acesso.
  if (hasAccess && !profile?.target_function) redirect('/dashboard/onboarding')

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
    nextLesson,
    nextExam,
    recommendations,
  } = data

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso rumo ao concurso ACA do IBGE.
        </p>
      </div>

      {/* Banner de acesso (aparece enquanto a compra não foi feita) */}
      {!hasAccess && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center">
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

      {/* Grid de 8 cards de métrica */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Dias restantes para a prova"
          value={daysUntilExam !== null ? `${daysUntilExam} dias` : '—'}
          subtitle={
            examDateLabel ? `Prova em ${examDateLabel}` : 'Defina em Configurações'
          }
          icon={CalendarDays}
          accentClassName="text-destructive bg-destructive-soft"
        />
        <DashboardCard
          title="Horas estudadas (total)"
          value={`${totalHoursStudied}h`}
          subtitle="Desde o início dos estudos"
          icon={Clock}
        />
        <DashboardCard
          title="Meta diária"
          value={`${dailyHoursDone}h / ${dailyGoalHours}h`}
          subtitle={`${Math.round((dailyHoursDone / dailyGoalHours) * 100)}% concluído hoje`}
          icon={Target}
        />
        <DashboardCard
          title="Meta semanal"
          value={`${weeklyHoursDone}h / ${weeklyGoalHours}h`}
          subtitle={`${Math.round((weeklyHoursDone / weeklyGoalHours) * 100)}% da semana`}
          icon={CalendarClock}
        />
        <DashboardCard
          title="Edital concluído"
          value={`${syllabusProgress}%`}
          subtitle="Conteúdo programático coberto"
          icon={GraduationCap}
        />
        <DashboardCard
          title="Próxima aula"
          value={nextLesson?.title ?? 'Tudo em dia!'}
          subtitle={nextLesson?.moduleTitle ?? 'Nenhuma lição pendente'}
          icon={BookOpen}
        />
        <DashboardCard
          title="Lições concluídas"
          value={`${completedLessons}/${totalLessons}`}
          subtitle={`${syllabusProgress}% do conteúdo`}
          icon={RotateCcw}
        />
        <DashboardCard
          title="Próximo simulado"
          value={nextExam?.title ?? 'Todos realizados'}
          subtitle={nextExam ? 'Ainda não realizado' : 'Parabéns!'}
          icon={FileCheck2}
        />
      </div>

      {/* Progresso por módulo + metas */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProgressWidget modules={moduleProgress} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Edital concluído</CardTitle>
              <CardDescription>Conteúdo total coberto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={syllabusProgress} />
              <p className="text-sm text-muted-foreground">
                {syllabusProgress}% concluído
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meta diária</CardTitle>
              <CardDescription>Horas estudadas hoje</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={(dailyHoursDone / dailyGoalHours) * 100} />
              <p className="text-sm text-muted-foreground">
                {dailyHoursDone}h de {dailyGoalHours}h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Meta semanal</CardTitle>
              <CardDescription>Horas estudadas na semana</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={(weeklyHoursDone / weeklyGoalHours) * 100} />
              <p className="text-sm text-muted-foreground">
                {weeklyHoursDone}h de {weeklyGoalHours}h
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gráfico de horas + recomendações */}
      <div className="grid gap-4 lg:grid-cols-2">
        <StudyChart data={studyDays} dailyGoalHours={dailyGoalHours} />
        <RecommendationCard recommendations={recommendations} />
      </div>
    </div>
  )
}
