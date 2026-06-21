/**
 * Observabilidade mínima e sem dependências. Log estruturado (JSON) + um ponto
 * único de captura de erros (`reportError`) que hoje escreve no console do
 * servidor (visível nos logs da Vercel) e serve de gancho para plugar
 * Sentry/Logtail depois — basta encaminhar dentro de `reportError`.
 *
 * Use em route handlers, Server Actions e error boundaries. Nunca logue segredos
 * nem PII desnecessária (e-mail/tokens) no `context`.
 */

type Level = 'info' | 'warn' | 'error'
type Context = Record<string, unknown>

function emit(level: Level, message: string, context?: Context) {
  const line = {
    level,
    message,
    ...(context ? { context } : {}),
    ts: new Date().toISOString(),
  }
  const serialized = JSON.stringify(line)
  if (level === 'error') console.error(serialized)
  else if (level === 'warn') console.warn(serialized)
  else console.log(serialized)
}

export const log = {
  info: (message: string, context?: Context) => emit('info', message, context),
  warn: (message: string, context?: Context) => emit('warn', message, context),
}

/**
 * Reporta um erro de forma estruturada. `where` identifica a origem
 * (ex.: 'stripe.webhook'); `context` adiciona metadados úteis (sem segredos).
 * Ponto único para encaminhar a um serviço de erros no futuro.
 */
export function reportError(
  where: string,
  error: unknown,
  context?: Context
): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  emit('error', `[${where}] ${message}`, { ...context, stack })
  // TODO(observabilidade): encaminhar para Sentry/Logtail aqui quando configurado.
}
