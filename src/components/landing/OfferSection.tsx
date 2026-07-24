import type { LucideIcon } from 'lucide-react'
import { ArrowRight, CalendarDays, Check, Flame, Lock, Map, Target } from 'lucide-react'

import { CheckoutButton } from '@/components/checkout/CheckoutButton'
import { CountdownTimer } from '@/components/CountdownTimer'

import { CTA_PRIMARY_ON_LIGHT, PRICE_DEADLINE } from './brand'

interface Bonus {
  icon: LucideIcon
  title: string
  desc: string
  badge: string
  immediate: boolean
}

const BONUSES: Bonus[] = [
  {
    icon: CalendarDays,
    title: 'Cronograma de estudos até 27/09',
    desc: 'O que estudar em cada semana, do dia da compra até a véspera da prova. Sem se perder, sem desperdiçar tempo.',
    badge: 'Acesso imediato',
    immediate: true,
  },
  {
    icon: Map,
    title: 'Edital esquematizado',
    desc: 'O mapa visual de tudo que mais cai na prova do IBGE. Estude o que importa, ignore o que não vai aparecer.',
    badge: 'Libera no dia 7',
    immediate: false,
  },
  {
    icon: Flame,
    title: 'Revisão final intensiva',
    desc: 'Os tópicos que mais caem, concentrados e revisados na reta final. Para você chegar no dia 27/09 afiado.',
    badge: 'Libera 7 dias antes da prova',
    immediate: false,
  },
]

/** Selo de status: verde-status p/ imediato; cadeado dourado (bronze) p/ liberação futura. */
function StatusBadge({ label, immediate }: { label: string; immediate: boolean }) {
  if (immediate) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1F7A52] px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-white">
        <Check className="h-3 w-3" strokeWidth={3} />
        {label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D4A017]/12 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-[#9A6E12] ring-1 ring-inset ring-[#D4A017]/40">
      <Lock className="h-3 w-3" strokeWidth={2.5} />
      {label}
    </span>
  )
}

/**
 * Oferta empilhada — banda CLARA (verde claro #EAF1EC), pra separar hero/urgência
 * escuros e distinguir da garantia creme. Hierarquia: a "Plataforma Completa" é o
 * núcleo (card maior, borda dourada), os três bônus são complementos menores.
 * Fecha com ancoragem de preço (cursinho R$3.000 vs R$97) e CTA dourado.
 */
export function OfferSection() {
  return (
    <section
      className="relative overflow-hidden text-[#1F2421]"
      style={{ backgroundColor: '#EAF1EC' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,160,23,0.08), transparent 65%)',
        }}
      />
      <div className="relative mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <h2 className="text-center font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Tudo que você recebe por{' '}
          <span className="text-[#9A6E12]">R$97</span>
        </h2>

        {/* Núcleo — Plataforma Completa. */}
        <div className="mt-14 flex flex-col gap-6 rounded-3xl border border-[#D4A017]/50 bg-white p-8 shadow-[0_18px_50px_-20px_rgba(11,61,46,0.28)] sm:flex-row sm:items-center sm:p-10">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0B3D2E] text-[#D4A017] shadow-lg shadow-[#0B3D2E]/20">
            <Target className="h-8 w-8" strokeWidth={1.75} />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-serif text-2xl font-semibold tracking-tight text-[#0B3D2E] sm:text-3xl">
                Plataforma completa
              </h3>
              <StatusBadge label="Acesso imediato" immediate />
            </div>
            <p className="mt-2 text-base text-[#5F6B66]">
              Teoria + 1.000 questões + 8 simulados. Tudo que sustenta a sua
              preparação, liberado no minuto da compra.
            </p>
          </div>
        </div>

        {/* Complementos — os três bônus. */}
        <p className="mt-10 text-center text-sm font-semibold uppercase tracking-widest text-[#5F6B66]">
          + 3 bônus de lançamento
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {BONUSES.map(({ icon: Icon, title, desc, badge, immediate }) => (
            <div
              key={title}
              className="flex flex-col rounded-2xl border border-black/[0.07] bg-white p-6 shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B3D2E]/[0.06] text-[#0B3D2E]">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h4 className="mt-5 font-serif text-lg font-semibold leading-snug tracking-tight text-[#0B3D2E]">
                {title}
              </h4>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#5F6B66]">
                {desc}
              </p>
              <div className="mt-5">
                <StatusBadge label={badge} immediate={immediate} />
              </div>
            </div>
          ))}
        </div>

        {/* Ancoragem de preço. */}
        <div className="mt-14 overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-sm">
          <div className="grid divide-y divide-black/[0.07] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="px-8 py-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9AA8A2]">
                Cursinho presencial
              </p>
              <p className="mt-3 font-serif text-3xl font-semibold text-[#9AA8A2] line-through decoration-[#9AA8A2]/70 decoration-2 sm:text-4xl">
                R$3.000
              </p>
              <p className="mt-1 text-sm text-[#9AA8A2]">por ano, todo ano</p>
            </div>
            <div className="bg-[#D4A017]/[0.08] px-8 py-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9A6E12]">
                Aprovus
              </p>
              <p className="mt-3 font-serif text-4xl font-bold text-[#D4A017] sm:text-5xl">
                R$97
              </p>
              <p className="mt-1 text-sm text-[#5F6B66]">
                pagamento único · acesso vitalício
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex w-full max-w-sm flex-col items-center">
          <CheckoutButton collectEmail className={CTA_PRIMARY_ON_LIGHT}>
            Quero me preparar por R$97
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
          </CheckoutButton>
          <div className="mt-8 flex flex-col items-center gap-2.5">
            <p className="text-xs font-medium uppercase tracking-widest text-[#5F6B66]">
              Preço sobe pra R$147 em
            </p>
            <CountdownTimer targetDate={PRICE_DEADLINE} size="sm" />
          </div>
        </div>
      </div>
    </section>
  )
}
