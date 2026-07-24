import { AlertTriangle } from 'lucide-react'

import { CheckoutButton } from '@/components/checkout/CheckoutButton'
import { CountdownTimer } from '@/components/CountdownTimer'

import { CTA_PRIMARY, PRICE_DEADLINE } from './brand'

/**
 * Urgência — fundo petróleo, o contador no MÁXIMO tamanho da página. Comparação
 * "hoje R$97 / depois R$147" em números grandes e CTA final forte.
 */
export function UrgencySection() {
  return (
    <section className="relative overflow-hidden bg-[#0B3D2E] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 60% at 50% 120%, rgba(0,214,104,0.14), transparent 65%)',
        }}
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center sm:py-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#D4A017]/30 bg-[#D4A017]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#E9C15A]">
          <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.25} />
          Essa condição muda em
        </span>

        <div className="mt-10">
          <CountdownTimer targetDate={PRICE_DEADLINE} size="lg" />
        </div>

        {/* Comparação de preço em números grandes. */}
        <div className="mt-14 grid w-full max-w-md grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[#D4A017]/25 bg-[#D4A017]/[0.06] px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#D4A017]">
              Hoje
            </p>
            <p className="mt-2 font-serif text-4xl font-bold text-[#D4A017] sm:text-5xl">
              R$97
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/60">
              + cronograma, edital e revisão final
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-transparent px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/45">
              Depois
            </p>
            <p className="mt-2 font-serif text-4xl font-bold text-white/45 sm:text-5xl">
              R$147
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              sem os bônus de lançamento
            </p>
          </div>
        </div>

        <p className="mt-12 max-w-xl font-serif text-xl font-medium leading-snug tracking-tight sm:text-2xl">
          A prova é 27/09. Cada dia que passa é um dia a menos de preparação.
        </p>

        <div className="mt-10 w-full max-w-sm">
          <CheckoutButton collectEmail className={CTA_PRIMARY}>
            Começar agora por R$97
          </CheckoutButton>
        </div>

        <p className="mt-6 text-sm text-white/60">
          Bônus garantidos pra quem entrar hoje.
        </p>
      </div>
    </section>
  )
}
