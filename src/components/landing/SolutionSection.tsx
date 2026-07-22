import type { LucideIcon } from 'lucide-react'
import { BookOpen, ClipboardCheck, ListChecks } from 'lucide-react'

interface Pillar {
  icon: LucideIcon
  highlight: string
  title: string
  desc: string
}

const PILLARS: Pillar[] = [
  {
    icon: BookOpen,
    highlight: 'Teoria',
    title: 'organizada de verdade',
    desc: 'Conteúdo por módulo e por cargo — você sabe exatamente o que estudar em cada etapa.',
  },
  {
    icon: ListChecks,
    highlight: '1.000',
    title: 'questões comentadas',
    desc: 'No estilo da banca IBFC, com explicação em cada alternativa pra fixar o padrão da prova.',
  },
  {
    icon: ClipboardCheck,
    highlight: '8',
    title: 'simulados completos',
    desc: 'Provas inteiras pra você treinar como se fosse o dia 27/09 — e chegar sem susto.',
  },
]

/**
 * Solução — fundo claro com leve lavagem teal (movimento em relação à Dor).
 * Os três pilares viram cards elevados, com número/palavra em destaque serifado
 * e ícone em container. Verde-teal como cor de acerto.
 */
export function SolutionSection() {
  return (
    <section
      className="text-[#1F2421]"
      style={{ background: 'linear-gradient(180deg, #FAFAF7 0%, #EEF6F1 100%)' }}
    >
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
        <h2 className="mx-auto max-w-3xl text-balance text-center font-serif text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          O Aprovus reúne tudo que você precisa para passar no IBGE — num só
          lugar.
        </h2>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          {PILLARS.map(({ icon: Icon, highlight, title, desc }) => (
            <div
              key={highlight}
              className="flex flex-col rounded-2xl border border-black/[0.06] bg-white p-7 shadow-[0_10px_30px_-12px_rgba(11,61,46,0.18)]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B3D2E]/[0.07] text-[#0B3D2E]">
                <Icon className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <p className="mt-6 font-serif text-4xl font-semibold leading-none tracking-tight text-[#0B3D2E]">
                {highlight}
              </p>
              <p className="mt-1.5 font-serif text-lg font-medium text-[#0B3D2E]/80">
                {title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#5F6B66]">{desc}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-14 max-w-2xl text-center font-serif text-xl font-medium leading-snug tracking-tight sm:text-2xl">
          Direto ao ponto. Sem enrolação.
          <br />
          Sem videoaula de 4 horas que não te prepara pra nada.
        </p>
      </div>
    </section>
  )
}
