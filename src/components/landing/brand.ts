/**
 * Constantes visuais da landing "Institucional Premium + Urgência Agressiva".
 *
 * Paleta petróleo + dourado (fixada pelo brief, fora dos tokens do app):
 *   petróleo #0B3D2E · petróleo profundo #072A20 · creme #FAFAF7 ·
 *   verde claro #EAF1EC · dourado #D4A017 (destaque/CTA) · dourado hover #E3B341 ·
 *   bronze #9A6E12 (ênfase sobre fundo CLARO) · verde-status #1F7A52 (só selos).
 *
 * O neon #00d668 foi removido — sobrevive só como #1F7A52 nos micro-selos.
 * As classes ficam como strings literais para o JIT do Tailwind enxergar os
 * valores arbitrários (`bg-[#D4A017]` etc.) no scan dos arquivos.
 */

/** Momento em que o preço sobe de R$97 para R$147 (America/Sao_Paulo). */
export const PRICE_DEADLINE = '2026-07-24T23:59:00-03:00'

/**
 * CTA principal — dourado, texto petróleo, micro-interação no hover (eleva +
 * brilha). Reconhecível na página toda, sobre fundo escuro OU claro.
 */
export const CTA_PRIMARY =
  'group inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-8 text-base font-bold uppercase tracking-wide text-[#0B3D2E] shadow-lg shadow-[#D4A017]/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E3B341] hover:shadow-xl hover:shadow-[#D4A017]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B3D2E] motion-reduce:transform-none'

/** Mesmo CTA dourado, com anel de foco calibrado para o verde claro da Oferta. */
export const CTA_PRIMARY_ON_LIGHT =
  'group inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-8 text-base font-bold uppercase tracking-wide text-[#0B3D2E] shadow-lg shadow-[#D4A017]/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E3B341] hover:shadow-xl hover:shadow-[#D4A017]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017] focus-visible:ring-offset-2 focus-visible:ring-offset-[#EAF1EC] motion-reduce:transform-none'
