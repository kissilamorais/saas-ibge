/**
 * Fonte única de verdade para preço e urgência.
 *
 * Vive em `lib/` (e não em `lib/stripe/server.ts`) porque é importado tanto por
 * client components — landing, trackers de analytics — quanto pelo servidor. O
 * módulo da Stripe carrega a secret key e não pode cruzar essa fronteira.
 *
 * Regra: nada de literal de preço fora daqui. Centavos é a fonte; reais são
 * derivados, para 67 e 6700 nunca divergirem.
 */

/**
 * Momento em que o preço de lançamento expira (America/Sao_Paulo).
 *
 * String ISO com offset explícito, não `Date`: o `CountdownTimer` recebe
 * `targetDate: string` e o offset `-03:00` é o que ancora a contagem em SP
 * independente do fuso do dispositivo.
 */
export const PRICE_DEADLINE = '2026-08-08T23:59:00-03:00'

const PRICE_DEADLINE_MS = new Date(PRICE_DEADLINE).getTime()

/** Preço promocional de lançamento, em centavos. */
export const LAUNCH_PRICE_CENTS = 6700

/** Preço cheio, em centavos. Serve de âncora visual durante o lançamento. */
export const FULL_PRICE_CENTS = 9700

/**
 * Preço cobrado agora, em centavos.
 *
 * Chamada por request no servidor (rotas de checkout), então o valor cobrado
 * vira sozinho na virada do prazo. No cliente depende do relógio do device —
 * ver nota sobre divergência de exibição no final do arquivo.
 */
export function getCurrentPriceCents(): number {
  return Date.now() < PRICE_DEADLINE_MS ? LAUNCH_PRICE_CENTS : FULL_PRICE_CENTS
}

/** `true` enquanto a promoção de lançamento estiver valendo. */
export function isLaunchPeriod(): boolean {
  return Date.now() < PRICE_DEADLINE_MS
}

export const LAUNCH_PRICE_BRL = LAUNCH_PRICE_CENTS / 100
export const FULL_PRICE_BRL = FULL_PRICE_CENTS / 100

/** Preço atual em reais — para copy e para o `value` dos eventos do Meta. */
export function getCurrentPriceBRL(): number {
  return getCurrentPriceCents() / 100
}

/**
 * Formata centavos como "R$67" / "R$1.297" — sem centavos quando redondo, que é
 * como a landing escreve o preço.
 */
export function formatPriceBRL(cents: number): string {
  const reais = cents / 100
  return `R$${reais.toLocaleString('pt-BR', {
    minimumFractionDigits: reais % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

/** Preço atual já formatado. Atalho para a copy. */
export function currentPriceLabel(): string {
  return formatPriceBRL(getCurrentPriceCents())
}

/**
 * Prazo da promoção como "08/08", para a copy corrida. Derivado de
 * `PRICE_DEADLINE` (fuso de SP) para a data escrita no texto nunca divergir da
 * que realmente vira o preço.
 */
export const PRICE_DEADLINE_LABEL = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
}).format(new Date(PRICE_DEADLINE))

/*
 * NOTA — exibição vs. cobrança.
 *
 * O preço cobrado sai de `getCurrentPriceCents()` no servidor (rota de
 * checkout), sempre correto. O preço EXIBIDO na landing é renderizado
 * estaticamente, então depende do `revalidate` da página para virar. Sem isso,
 * o texto congela no build e passa a divergir do valor cobrado depois do prazo.
 * Ver `export const revalidate` em `src/app/page.tsx`.
 */
