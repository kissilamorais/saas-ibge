import { redirect } from 'next/navigation'

import { getProfile, getUser } from '@/lib/auth/session'
import { isTrialCargo } from '@/lib/trial/types'
import { TrialPlayer } from './_components/TrialPlayer'

export default async function QuestoesPage() {
  if (!(await getUser())) redirect('/teste')

  const profile = await getProfile()
  // Sem cargo escolhido não há como segmentar o diagnóstico — volta um passo.
  if (!isTrialCargo(profile?.trial_cargo)) redirect('/teste/cargo')

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:py-14">
      <TrialPlayer cargo={profile.trial_cargo} />
    </div>
  )
}
