'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { CTA_PRIMARY } from '@/components/landing/brand'

/**
 * Ponte entre o diagnóstico e a oferta: dois caminhos para o plano de estudo —
 * atendimento no WhatsApp (que vira lead quente no funil manual) ou o plano
 * resumido ali mesmo, já emendado no CTA de compra.
 *
 * O WhatsApp abre em nova aba e NÃO esconde os botões: quem pede o plano por
 * lá costuma querer ver a prévia também.
 */

/**
 * Primeiro passo sugerido por matéria. Chaveado pelo `title` do módulo no
 * Supabase (ver `scripts/seed.mjs`) — se um módulo for renomeado, o fallback
 * genérico entra no lugar em vez de a linha sumir.
 */
const ORIENTACOES: Record<string, string> = {
  Português:
    'Priorize os módulos de Interpretação de Texto e Coerência antes da gramática de detalhe.',
  'Raciocínio Lógico':
    'Comece por estruturas lógicas e lógica de argumentação — sequências e probabilidade vêm depois.',
  Administração:
    'Foque em administração pública e gestão de processos, que é onde a prova concentra as questões.',
  Informática:
    'Revise conceitos de hardware, software e segurança da informação, depois pacote Office.',
  'Conhecimentos Técnicos':
    'Estude o conteúdo específico do Censo e as rotinas de campo do seu cargo.',
}

function orientacao(modulo: string): string {
  return (
    ORIENTACOES[modulo] ??
    `Comece os módulos de ${modulo} do início, sem pular para os exercícios.`
  )
}

export interface MateriaFraca {
  modulo: string
  score: number
}

export function PlanoEngajamento({
  whatsappHref,
  fracas,
  precoLabel,
}: {
  whatsappHref: string
  /** Módulos abaixo de 50% de acerto, já filtrados no servidor. */
  fracas: MateriaFraca[]
  /** Preço já formatado no servidor — evita depender do relógio do device. */
  precoLabel: string
}) {
  const [planoAberto, setPlanoAberto] = useState(false)

  return (
    <section className="mt-10 rounded-2xl border border-[#D4A017]/30 bg-[#0B3D2E] p-7 sm:p-9">
      <h2 className="text-balance font-serif text-2xl font-semibold leading-tight text-white">
        Quer receber seu plano de estudo personalizado?
      </h2>
      <p className="mt-3 text-balance text-sm leading-relaxed text-white/75">
        Com base no seu diagnóstico, montamos exatamente o que você precisa
        estudar primeiro.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 text-base font-bold text-white shadow-lg shadow-[#25D366]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#20BD5A] hover:shadow-xl hover:shadow-[#25D366]/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B3D2E] motion-reduce:transform-none"
        >
          <IconeWhatsApp className="h-5 w-5" />
          Receber no WhatsApp
        </a>

        {!planoAberto && (
          <button
            type="button"
            onClick={() => setPlanoAberto(true)}
            className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-6 text-base font-bold text-[#0B3D2E] shadow-lg shadow-[#D4A017]/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E3B341] hover:shadow-xl hover:shadow-[#D4A017]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B3D2E] motion-reduce:transform-none"
          >
            <ChevronDown className="h-5 w-5" strokeWidth={2.5} />
            Ver plano aqui mesmo
          </button>
        )}
      </div>

      {planoAberto && (
        <div className="mt-8 animate-rise-in">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#D4A017]">
            {fracas.length > 0 ? 'Comece por aqui' : 'Seu próximo passo'}
          </h3>

          {fracas.length > 0 ? (
            <ol className="mt-4 space-y-3">
              {fracas.map((f, i) => (
                <li
                  key={f.modulo}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-white">
                      {i + 1}. {f.modulo}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-[#D4A017]">
                      {f.score}% de acerto
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                    {orientacao(f.modulo)}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-white/70">
              Nenhuma matéria ficou abaixo de 50% — seu plano agora é ganhar
              ritmo e constância, resolvendo simulados completos com tempo
              cronometrado.
            </p>
          )}

          <div className="mt-6 rounded-xl border border-[#D4A017]/40 bg-[#D4A017]/10 p-6 text-center">
            <p className="text-balance font-serif text-lg font-semibold leading-snug text-white">
              Para treinar esses pontos fracos, acesse a plataforma completa
            </p>
            <Link href="/" className={`${CTA_PRIMARY} mt-5 w-full sm:w-auto`}>
              Desbloquear Aprovus por {precoLabel} →
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}

/** Glifo do WhatsApp — o lucide não distribui ícones de marca. */
function IconeWhatsApp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24z" />
    </svg>
  )
}
