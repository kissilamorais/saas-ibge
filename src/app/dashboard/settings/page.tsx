import { redirect } from 'next/navigation'

import { getProfile } from '@/lib/auth/session'
import { StudyConfigForm } from '@/components/dashboard/StudyConfigForm'
import { FunctionSelector } from '@/components/onboarding/FunctionSelector'
import { PageHeader } from '@/components/layout/PageHeader'
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
      <PageHeader
        eyebrow="Sua conta"
        title="Configurações"
        description="Ajuste sua trilha, a data da prova e suas metas de estudo."
      />

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
