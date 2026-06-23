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
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Vamos montar sua trilha
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Qual cargo você vai prestar?
        </h1>
        <p className="text-pretty text-muted-foreground">
          Escolha sua função no concurso do IBGE. A partir dela, montamos sua
          trilha com os módulos e simulados certos. Dá para trocar depois nas
          configurações.
        </p>
      </div>

      <FunctionSelector />
    </div>
  )
}
