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
 */
export function trackPixel(
  event: string,
  params?: Record<string, unknown>
): void {
  if (!PIXEL_ENABLED) return
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  window.fbq('track', event, params)
}
