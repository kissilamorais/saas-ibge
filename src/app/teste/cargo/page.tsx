import { redirect } from 'next/navigation'

import { createAdminClient } from '@/lib/supabase/admin'
import { getProfile, getUser } from '@/lib/auth/session'
import type { TrialCargo } from '@/lib/trial/types'
import { CargoPicker } from './_components/CargoPicker'

async function setupTrialProfile(userId: string) {
  const admin = createAdminClient()

  // Buscar user_metadata para extrair whatsapp (gravado em /api/trial/signup)
  const {
    data: { user },
  } = await admin.auth.admin.getUserById(userId)

  const whatsapp = (user?.user_metadata?.whatsapp as string) || null
  const isTrialMarker = user?.user_metadata?._trial === 'true'

  // Se o user marcou como trial no signup, fazer o setup uma única vez
  if (isTrialMarker && whatsapp) {
    await admin
      .from('profiles')
      .update({ whatsapp, is_trial: true })
      .eq('id', userId)
  }
}

export default async function CargoPage() {
  // /teste/* fica fora do middleware (funil público), então cada etapa checa
  // a sessão por conta própria.
  const user = await getUser()
  if (!user) redirect('/teste')

  // Setup do perfil trial se for primeiro acesso
  await setupTrialProfile(user.id)

  const profile = await getProfile()

  return (
    <div className="mx-auto max-w-md px-6 py-14 sm:py-20">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#0B3D2E]/50">
          Passo 1 de 2
        </p>
        <h1 className="mt-3 text-balance font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Qual cargo você vai prestar?
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[#0B3D2E]/70">
          Usamos isso para montar seu diagnóstico e, depois, sua trilha de
          estudo.
        </p>
      </div>

      <div className="mt-10">
        <CargoPicker
          cargoAtual={(profile?.trial_cargo as TrialCargo | null) ?? null}
        />
      </div>
    </div>
  )
}
