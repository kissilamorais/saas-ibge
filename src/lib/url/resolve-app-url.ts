const APP_URL = process.env.NEXT_PUBLIC_APP_URL

/**
 * Retorna a URL base para links de e-mail de auth.
 * Usa NEXT_PUBLIC_APP_URL como fonte de verdade — nunca deriva de headers
 * controláveis pelo cliente (x-forwarded-host), evitando host header injection.
 */
export function resolveAppUrl(): string {
  if (!APP_URL) throw new Error('NEXT_PUBLIC_APP_URL não está definida')
  return APP_URL
}
