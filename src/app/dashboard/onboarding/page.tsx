import { redirect } from 'next/navigation'

import { requireActiveSubscription } from '@/lib/auth/session'
import { FunctionSelector } from '@/components/onboarding/FunctionSelector'

/**
 * Onboarding do 1º acesso: o candidato escolhe a função-alvo (cargo). A partir
 * dela, todo o catálogo (módulos e simulados) é filtrado. Se já escolheu,
 * pula direto para a dashboard.
 */
export default async function OnboardingPage() {
  const profile = await requireActiveSubscription()
  if (profile.target_function) redirect('/dashboard')

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6 md:p-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Qual cargo você vai prestar?
        </h1>
        <p className="text-muted-foreground">
          Escolha sua função no concurso do IBGE. Vamos montar sua trilha de
          estudo com os módulos e simulados certos para ela. Você pode trocar
          depois nas configurações.
        </p>
      </div>

      <FunctionSelector />
    </div>
  )
}
