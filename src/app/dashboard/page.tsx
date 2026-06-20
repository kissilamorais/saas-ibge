import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  Clock,
  FileCheck2,
  GraduationCap,
  RotateCcw,
  Target,
} from 'lucide-react'

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

// TODO: substituir por dados reais do Supabase (study_sessions, progress, schedule)
const mockData = {
  examDate: '2026-09-20',
  daysUntilExam: 93,
  totalHoursStudied: 142,
  dailyGoalHours: 4,
  dailyHoursDone: 2.5,
  weeklyGoalHours: 25,
  weeklyHoursDone: 18,
  syllabusProgress: 64,
  nextLesson: {
    module: 'Raciocínio Lógico',
    title: 'Estruturas Lógicas e Tabelas-Verdade',
  },
  nextReview: {
    module: 'Português',
    title: 'Concordância Verbal',
    when: 'Hoje, 19h',
  },
  nextExam: {
    title: 'Simulado 3 - ACA',
    when: 'Sábado, 09h',
  },
}

export default function DashboardPage() {
  const {
    daysUntilExam,
    totalHoursStudied,
    dailyGoalHours,
    dailyHoursDone,
    weeklyGoalHours,
    weeklyHoursDone,
    syllabusProgress,
    nextLesson,
    nextReview,
    nextExam,
  } = mockData

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso rumo ao concurso ACA do IBGE.
        </p>
      </div>

      {/* Grid de 8 cards de métrica */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Dias restantes para a prova"
          value={`${daysUntilExam} dias`}
          subtitle="Prova em 20/09/2026"
          icon={CalendarDays}
          accentClassName="text-red-500 bg-red-500/10"
        />
        <DashboardCard
          title="Horas estudadas (total)"
          value={`${totalHoursStudied}h`}
          subtitle="Desde o início dos estudos"
          icon={Clock}
          accentClassName="text-blue-500 bg-blue-500/10"
        />
        <DashboardCard
          title="Meta diária"
          value={`${dailyHoursDone}h / ${dailyGoalHours}h`}
          subtitle={`${Math.round((dailyHoursDone / dailyGoalHours) * 100)}% concluído hoje`}
          icon={Target}
          accentClassName="text-emerald-500 bg-emerald-500/10"
        />
        <DashboardCard
          title="Meta semanal"
          value={`${weeklyHoursDone}h / ${weeklyGoalHours}h`}
          subtitle={`${Math.round((weeklyHoursDone / weeklyGoalHours) * 100)}% da semana`}
          icon={CalendarClock}
          accentClassName="text-violet-500 bg-violet-500/10"
        />
        <DashboardCard
          title="Edital concluído"
          value={`${syllabusProgress}%`}
          subtitle="Conteúdo programático coberto"
          icon={GraduationCap}
          accentClassName="text-amber-500 bg-amber-500/10"
        />
        <DashboardCard
          title="Próxima aula"
          value={nextLesson.title}
          subtitle={nextLesson.module}
          icon={BookOpen}
          accentClassName="text-sky-500 bg-sky-500/10"
        />
        <DashboardCard
          title="Próxima revisão"
          value={nextReview.title}
          subtitle={`${nextReview.module} • ${nextReview.when}`}
          icon={RotateCcw}
          accentClassName="text-orange-500 bg-orange-500/10"
        />
        <DashboardCard
          title="Próximo simulado"
          value={nextExam.title}
          subtitle={nextExam.when}
          icon={FileCheck2}
          accentClassName="text-pink-500 bg-pink-500/10"
        />
      </div>

      {/* Progresso por módulo + metas */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Sem props: usa os dados mockados internos do widget */}
          <ProgressWidget />
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
        <StudyChart dailyGoalHours={dailyGoalHours} />
        <RecommendationCard />
      </div>
    </div>
  )
}
