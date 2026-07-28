import { redirect } from 'next/navigation'

import { getTrialSession } from '@/lib/trial-session'
import { isTrialCargo } from '@/lib/trial/types'
import { TrialPlayer } from './_components/TrialPlayer'

export default async function QuestoesPage() {
  const session = await getTrialSession()
  if (!session) redirect('/teste')

  // Sem cargo escolhido não há como segmentar o diagnóstico — volta um passo.
  // O cargo vem do próprio cookie (reemitido por /api/trial/cargo), então esta
  // etapa não custa nenhuma consulta.
  if (!isTrialCargo(session.cargo)) redirect('/teste/cargo')

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 sm:py-14">
      <TrialPlayer cargo={session.cargo} />
    </div>
  )
}
