import { redirect } from 'next/navigation'
import { Clock, Target, Shield, Mail, Lock } from 'lucide-react'

import { getUser } from '@/lib/auth/session'
import { TrialSignupForm } from './_components/TrialSignupForm'

const PILLS = [
  { icon: Clock, texto: '5 minutos' },
  { icon: Target, texto: 'Diagnóstico por matéria' },
  { icon: Lock, texto: 'Sem cartão de crédito' },
]

const TRUST = [
  { icon: Shield, label: 'Dados seguros' },
  { icon: Mail, label: 'Sem spam' },
  { icon: Lock, label: 'Grátis de verdade' },
]

export default async function TestePage() {
  // Quem já está logado pula o cadastro e vai direto escolher o cargo.
  if (await getUser()) redirect('/teste/cargo')

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF7] text-[#0B3D2E]">
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#0B3D2E]/15 bg-[#0B3D2E]/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#0B3D2E]/80">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4A017]" />
              Banca IBFC · IBGE 2026
            </div>

            {/* Título */}
            <h1 className="mt-6 text-balance font-serif text-4xl font-semibold leading-tight tracking-tight text-[#0B3D2E] sm:text-5xl">
              Descubra o que você{' '}
              <span className="italic text-[#0B3D2E]">realmente</span> precisa
              estudar
            </h1>

            {/* Subtítulo */}
            <p className="mt-5 text-balance text-base leading-relaxed text-[#0B3D2E]/75 sm:text-lg">
              Responda 10 questões no estilo da prova e receba um diagnóstico
              completo das suas matérias fortes e fracas.
            </p>

            {/* Pills */}
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {PILLS.map(({ icon: Icon, texto }) => (
                <li
                  key={texto}
                  className="inline-flex items-center gap-2 rounded-full border border-[#0B3D2E]/10 bg-white px-3.5 py-2 text-xs font-medium text-[#0B3D2E]/80 shadow-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-[#D4A017]" strokeWidth={2} />
                  {texto}
                </li>
              ))}
            </ul>
          </div>

          {/* Formulário */}
          <div className="mt-10 rounded-2xl border border-[#0B3D2E]/10 bg-white p-6 shadow-sm sm:p-10">
            <p className="mb-6 text-center text-sm font-semibold text-[#0B3D2E]">
              Crie sua conta grátis
            </p>
            <TrialSignupForm />
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {TRUST.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-xs text-[#0B3D2E]/60"
              >
                <Icon className="h-3.5 w-3.5 text-[#D4A017]" strokeWidth={2} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
