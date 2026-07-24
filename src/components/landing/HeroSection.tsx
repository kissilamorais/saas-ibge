import { CalendarDays, CreditCard, Infinity as InfinityIcon, ShieldCheck } from 'lucide-react'

import { CheckoutButton } from '@/components/checkout/CheckoutButton'
import { CountdownTimer } from '@/components/CountdownTimer'

import { CTA_PRIMARY_ON_LIGHT, PRICE_DEADLINE } from './brand'

const TRUST = [
  { icon: ShieldCheck, label: 'Garantia de 7 dias' },
  { icon: InfinityIcon, label: 'Acesso vitalício' },
  { icon: CreditCard, label: 'Pagamento único' },
]

/**
 * Hero — fundo petróleo bem claro (#E8EFEC) com brilho dourado sutil no topo e
 * trama de pontos em petróleo. Abre com o badge do concurso, a pergunta-tese
 * serifada e o contador de urgência em blocos. Ponto de maior tensão da página.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#E8EFEC] text-[#0B3D2E]">
      {/* Brilho dourado no topo + trama de pontos em petróleo (baixa opacidade). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 55% at 50% -10%, rgba(212,160,23,0.12), transparent 60%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'radial-gradient(rgba(11,61,46,0.06) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 75%)',
        }}
      />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center sm:py-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#0B3D2E]/15 bg-[#0B3D2E]/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#0B3D2E]/80 backdrop-blur">
          <CalendarDays className="h-3.5 w-3.5 text-[#D4A017]" />
          Concurso IBGE 2026 · Prova 27/09
        </span>

        <h1 className="mt-8 text-balance font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-[#0B3D2E] sm:text-6xl">
          A prova do IBGE é dia 27/09.
          <br />
          Você vai chegar lá preparado
          <br />
          <span className="italic text-[#0B3D2E]">
            — ou vai torcer pra cair só o que você viu?
          </span>
        </h1>

        <div className="mt-10 w-full max-w-sm">
          <CheckoutButton collectEmail className={CTA_PRIMARY_ON_LIGHT}>
            Começar agora por R$97
          </CheckoutButton>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2.5">
          <p className="text-xs font-medium uppercase tracking-widest text-[#0B3D2E]/60">
            Preço sobe pra R$147 em
          </p>
          <CountdownTimer targetDate={PRICE_DEADLINE} size="md" />
        </div>

        <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {TRUST.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 text-sm text-[#0B3D2E]/75"
            >
              <Icon className="h-4 w-4 text-[#D4A017]" strokeWidth={1.75} />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
