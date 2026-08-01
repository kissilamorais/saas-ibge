/**
 * Consentimento de cookies (LGPD, art. 7º, I — VUL-A04 da auditoria de
 * 31/07/2026). "necessary" nunca é opt-in (sessão/carrinho, sem opção de
 * recusa); "analytics" (GA4) e "marketing" (Meta Pixel/CAPI) só rodam depois
 * de escolha explícita do visitante.
 *
 * Guardado em cookie 1st-party (não localStorage): assim o valor pode, no
 * futuro, ser lido em Server Components/Route Handlers que precisem decidir
 * server-side (ex.: Meta CAPI) sem round-trip ao cliente.
 */

export interface ConsentChoices {
  analytics: boolean
  marketing: boolean
}

export interface ConsentState extends ConsentChoices {
  /** Versão do texto do banner aceito — bump ao mudar categorias/redação. */
  version: number
}

export const CONSENT_COOKIE_NAME = 'aprovus_consent'
export const CONSENT_VERSION = 1
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365 // 1 ano

/** Serializa para o valor do cookie — texto simples, sem dado pessoal. */
function serialize(choices: ConsentChoices): string {
  return `v${CONSENT_VERSION}.a${choices.analytics ? 1 : 0}.m${choices.marketing ? 1 : 0}`
}

function parse(raw: string | undefined | null): ConsentState | null {
  if (!raw) return null
  const match = /^v(\d+)\.a([01])\.m([01])$/.exec(raw)
  if (!match) return null
  return {
    version: Number(match[1]),
    analytics: match[2] === '1',
    marketing: match[3] === '1',
  }
}

/** Lê o cookie a partir de um header `Cookie` bruto (Route Handlers/Server Components). */
export function parseConsentFromCookieHeader(
  cookieHeader: string | null | undefined,
): ConsentState | null {
  if (!cookieHeader) return null
  const entry = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CONSENT_COOKIE_NAME}=`))
  if (!entry) return null
  return parse(decodeURIComponent(entry.slice(CONSENT_COOKIE_NAME.length + 1)))
}

/** Lê o cookie no browser (`document.cookie`). Client-only. */
export function readConsentCookie(): ConsentState | null {
  if (typeof document === 'undefined') return null
  return parseConsentFromCookieHeader(document.cookie)
}

/** Grava a escolha no browser (`document.cookie`). Client-only. */
export function writeConsentCookie(choices: ConsentChoices): void {
  if (typeof document === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(serialize(choices))}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`
}
