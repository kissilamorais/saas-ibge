'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQ = [
  {
    q: 'Funciona pra qual cargo?',
    a: 'Para todos os cargos do IBGE 2026 — ACA, ACI, AOR, ACR e ACS. O conteúdo cobre as disciplinas comuns a todos os cargos e você escolhe sua trilha específica dentro da plataforma.',
  },
  {
    q: 'Não gostei — como peço o reembolso?',
    a: 'Manda um e-mail em até 7 dias depois da compra. Sem perguntas, sem burocracia. Devolvo 100% do valor.',
  },
  {
    q: 'Precisa instalar alguma coisa?',
    a: 'Não. Funciona direto no navegador — computador, celular ou tablet.',
  },
  {
    q: 'Tenho acesso a tudo de uma vez?',
    a: 'Sim. A plataforma completa é liberada imediatamente. Os bônus têm desbloqueio progressivo para você aproveitar no momento certo da preparação.',
  },
  {
    q: 'Consigo estudar com pouco tempo por dia?',
    a: 'Sim. O cronograma foi montado para quem tem entre 1 e 2 horas por dia. Você não precisa de maratona — precisa de consistência no que cai na prova.',
  },
  {
    q: 'Como entro em contato?',
    a: (
      <>
        Por e-mail:{' '}
        <a
          href="mailto:suporteaprovus@gmail.com"
          className="font-medium text-[#9A6E12] underline underline-offset-2 hover:text-[#0B3D2E]"
        >
          suporteaprovus@gmail.com
        </a>
        . Respondemos em até 24 horas.
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
