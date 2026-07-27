import { redirect } from 'next/navigation'
import { ClipboardCheck, Clock, Target } from 'lucide-react'

import { getUser } from '@/lib/auth/session'
import { TrialSignupForm } from './_components/TrialSignupForm'

const BENEFICIOS = [
  { icon: Clock, texto: '10 questões · 5 minutos' },
  { icon: Target, texto: 'Diagnóstico por matéria' },
  { icon: ClipboardCheck, texto: 'Sem cartão de crédito' },
]

export default async function TestePage() {
  // Quem já está logado pula o cadastro e vai direto escolher o cargo.
  if (await getUser()) redirect('/teste/cargo')

  return (
    <div className="mx-auto max-w-md px-6 py-14 sm:py-20">
      <div className="text-center">
        <h1 className="text-balance font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Descubra o que você{' '}
          <span className="italic">realmente</span> precisa estudar
        </h1>
        <p className="mt-4 text-balance text-sm leading-relaxed text-[#0B3D2E]/70 sm:text-base">
          Responda 10 questões no estilo da banca IBFC e receba um diagnóstico
          das suas matérias fortes e fracas.
        </p>
      </div>

      <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {BENEFICIOS.map(({ icon: Icon, texto }) => (
          <li
            key={texto}
            className="flex items-center gap-1.5 text-xs text-[#0B3D2E]/70"
          >
            <Icon className="h-3.5 w-3.5 text-[#D4A017]" strokeWidth={1.75} />
            {texto}
          </li>
        ))}
      </ul>

      <div className="mt-10 rounded-2xl border border-[#0B3D2E]/10 bg-white p-6 shadow-sm sm:p-8">
        <TrialSignupForm />
      </div>
    </div>
  )
}
