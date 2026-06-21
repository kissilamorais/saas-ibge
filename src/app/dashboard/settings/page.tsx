import { redirect } from 'next/navigation'

import { getProfile } from '@/lib/auth/session'
import { StudyConfigForm } from '@/components/dashboard/StudyConfigForm'
import { FunctionSelector } from '@/components/onboarding/FunctionSelector'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function SettingsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login?redirect=/dashboard/settings')

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Ajuste sua trilha, a data da prova e suas metas de estudo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trilha (cargo)</CardTitle>
          <CardDescription>
            Trocar de cargo muda os módulos e simulados disponíveis. Seu
            histórico de respostas é mantido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FunctionSelector
            initial={profile.target_function}
            redirectTo="/dashboard/settings"
            ctaLabel="Salvar trilha"
          />
        </CardContent>
      </Card>

      <StudyConfigForm
        initial={{
          examDate: profile.exam_date ?? '',
          dailyGoalHours: profile.daily_goal_hours,
          weeklyGoalHours: profile.weekly_goal_hours,
        }}
      />
    </div>
  )
}
