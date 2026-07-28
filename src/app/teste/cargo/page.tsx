import { redirect } from 'next/navigation'

import { getTrialSession } from '@/lib/trial-session'
import { isTrialCargo } from '@/lib/trial/types'
import { CargoPicker } from './_components/CargoPicker'

export default async function CargoPage() {
  // /teste/* fica fora do middleware (funil público) e o visitante do teste não
  // tem conta no Auth: quem identifica o lead é o cookie assinado do funil
  // (lib/trial-session.ts). Sem cookie, volta para o começo.
  const session = await getTrialSession()
  if (!session) redirect('/teste')

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
          cargoAtual={isTrialCargo(session.cargo) ? session.cargo : null}
        />
      </div>
    </div>
  )
}
