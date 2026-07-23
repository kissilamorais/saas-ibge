'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQ = [
  {
    q: 'Funciona pra qual cargo?',
    a: 'Para todos os cargos do concurso IBGE 2026: ACA, ACI, AOR, ACR e ACS. Você escolhe seu cargo na entrada e a plataforma monta sua trilha.',
  },
  {
    q: 'E se eu não gostar?',
    a: '7 dias de garantia total. Devolvo tudo, sem pergunta nenhuma.',
  },
  {
    q: 'Precisa instalar alguma coisa?',
    a: 'Não. É tudo online, abre no celular ou computador.',
  },
  {
    q: 'Vou ter acesso a tudo de uma vez?',
    a: 'O cronograma e a plataforma completa são imediatos. O edital esquematizado libera no dia 7. A revisão final libera 7 dias antes da prova, quando você mais precisa.',
  },
  {
    q: 'Quanto tempo preciso por dia?',
    a: 'O cronograma foi montado pra quem tem vida. 30 minutos a 1 hora por dia já te coloca na frente de quem não está estudando nada.',
  },
  {
    q: 'Como falo com vocês?',
    a: (
      <>
        É só mandar um e-mail para{' '}
        <a
          href="mailto:getvellum@gmail.com"
          className="font-medium text-[#9A6E12] underline underline-offset-2 hover:text-[#0B3D2E]"
        >
          getvellum@gmail.com
        </a>{' '}
        que a gente responde. Estamos disponíveis para qualquer dúvida sobre o
        material, a plataforma ou seu acesso.
      </>
    ),
  },
]

/**
 * FAQ — accordion de verdade (clica pra expandir). Um item aberto por vez,
 * chevron que gira. Visual limpo com hover sutil.
 */
export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="bg-[#FAFAF7] text-[#1F2421]">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <h2 className="text-center font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Perguntas frequentes
        </h2>

        <div className="mt-12 space-y-3">
          {FAQ.map(({ q, a }, i) => {
            const isOpen = open === i
            return (
              <div
                key={q}
                className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-sm transition-colors"
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-[#0B3D2E]/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B3D2E]/30"
                  >
                    <span className="font-medium text-[#1F2421] sm:text-lg">
                      {q}
                    </span>
                    <ChevronDown
                      className={
                        'h-5 w-5 shrink-0 text-[#0B3D2E] transition-transform duration-200 motion-reduce:transition-none ' +
                        (isOpen ? 'rotate-180' : '')
                      }
                      strokeWidth={2}
                    />
                  </button>
                </h3>
                <div
                  className={
                    'grid transition-all duration-200 ease-out motion-reduce:transition-none ' +
                    (isOpen
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0')
                  }
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-[#5F6B66]">{a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
