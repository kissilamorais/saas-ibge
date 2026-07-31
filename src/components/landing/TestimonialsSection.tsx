import Image from 'next/image'
import { MessageCircle, Quote, Star } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { TRIAL_CARGOS } from '@/lib/trial/types'
import type { Testimonial } from '@/types'

/**
 * Código do cargo → nome oficial do concurso.
 *
 * Derivado de `TRIAL_CARGOS` em vez de reescrito à mão: os rótulos aqui eram
 * cargos que não existem no edital ("Analista de Orçamento"), e a landing
 * anunciava aluno em vaga inventada. Importando a lista do funil, um ajuste de
 * nomenclatura entra nos dois lugares de uma vez.
 *
 * O `?? author_cargo` no `authorLine` cobre o que o admin digitar livre no
 * campo de cargo — o valor cru vai para a tela, sem tradução.
 */
const CARGO_LABEL: Record<string, string> = Object.fromEntries(
  TRIAL_CARGOS.map((c) => [c.value, c.label]),
)

function authorLine(testimonial: Testimonial) {
  if (!testimonial.author_cargo) return testimonial.author_name
  const label =
    CARGO_LABEL[testimonial.author_cargo] ?? testimonial.author_cargo
  return `${testimonial.author_name} · ${label}`
}

/**
 * Prova social — fundo petróleo escuro (mesmo tom da Urgência), cards claros
 * elevados para dar peso visual aos depoimentos entre a Oferta e a Garantia.
 * Retorna `null` sem depoimentos ativos: sem seção vazia na landing.
 */
export function TestimonialsSection({
  testimonials,
}: {
  testimonials: Testimonial[]
}) {
  if (testimonials.length === 0) return null

  return (
    <section
      id="depoimentos"
      aria-label="Depoimentos"
      className="bg-[#0B3D2E] text-white"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <h2 className="text-balance text-center font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          Quem testou, aprovou o material
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-base text-white/70">
          Depoimentos de quem usou o Aprovus na preparação
        </p>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Card
              key={t.id}
              className="flex flex-col justify-between rounded-2xl border-0 bg-white p-6 text-[#1F2421] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)]"
            >
              <CardContent className="p-0">
                <Quote
                  className="h-6 w-6 text-[#D4A017]"
                  strokeWidth={2}
                  aria-hidden
                />
                <p className="mt-4 text-[0.95rem] leading-relaxed text-[#1F2421]">
                  {t.content}
                </p>
              </CardContent>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
                <div className="flex items-center gap-3">
                  {t.image_url && (
                    <Image
                      src={t.image_url}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-[#0B3D2E]">
                      {authorLine(t)}
                    </p>
                    <div
                      className="mt-1 flex items-center gap-0.5"
                      aria-label="5 de 5 estrelas"
                    >
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5 fill-[#D4A017] text-[#D4A017]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {t.source === 'whatsapp' && (
                  <span className="flex items-center gap-1 whitespace-nowrap text-xs text-[#5F6B66]">
                    <MessageCircle className="h-3.5 w-3.5" />
                    via WhatsApp
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
