// Helper único do Meta Pixel. Centraliza a regra de ativação:
// só dispara em produção E com o Pixel ID configurado. Em dev é no-op,
// então nenhum evento falso é enviado durante o desenvolvimento.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export const PIXEL_ENABLED =
  process.env.NODE_ENV === 'production' && Boolean(META_PIXEL_ID)

/**
 * Dispara um evento padrão do Meta. No-op se o pixel estiver desativado
 * (dev) ou se o fbq ainda não carregou. Nunca passe dados pessoais aqui —
 * só nome do evento e, quando fizer sentido, value/currency.
 *
 * `options.eventID` deve ser passado nos eventos que também são enviados pela
 * Conversions API (ex.: Purchase com o order_nsu) para o Meta deduplicar
 * browser <-> server e não contar a conversão duas vezes.
 */
export function trackPixel(
  event: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string }
): void {
  if (!PIXEL_ENABLED) return
  if (typeof window === 'undefined') return

  // O script do pixel (afterInteractive) pode ainda não ter inicializado
  // quando um evento "ao montar" (ViewContent/Purchase) tenta disparar.
  // Tentamos novamente por até ~3s para não perder o evento.
  let attempts = 0
  const fire = () => {
    if (typeof window.fbq === 'function') {
      if (options?.eventID) window.fbq('track', event, params, options)
      else window.fbq('track', event, params)
      return
    }
    if (attempts++ < 20) setTimeout(fire, 150)
  }
  fire()
}
