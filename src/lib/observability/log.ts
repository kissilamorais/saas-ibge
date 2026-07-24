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
 * Além do log no console (Vercel), dispara um alerta no Discord (se configurado)
 * — é o canal que avisa em tempo real quando algo que perde dinheiro acontece.
 */
export function reportError(
  where: string,
  error: unknown,
  context?: Context
): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  emit('error', `[${where}] ${message}`, { ...context, stack })
  // Alerta em tempo real. Só severity 'error' (é o único caller de notifyDiscord).
  // Não passamos o stack pro Discord (ruído); o console já tem o stack completo.
  notifyDiscord(where, message, context)
}

/**
 * Envia um alerta ao webhook do Discord (DISCORD_WEBHOOK_URL). Best-effort:
 *   - se a env não estiver setada, degrada em silêncio (não quebra o fluxo);
 *   - fire-and-forget e nunca lança — uma falha do Discord não pode derrubar o
 *     handler que reportou o erro;
 *   - timeout curto para não segurar a função caso o Discord pendure.
 */
function notifyDiscord(where: string, message: string, context?: Context): void {
  const url = process.env.DISCORD_WEBHOOK_URL
  if (!url) return

  let contextBlock = ''
  try {
    if (context && Object.keys(context).length > 0) {
      contextBlock = `\n\`\`\`${JSON.stringify(context)}\`\`\``
    }
  } catch {
    // Contexto não serializável (circular): ignora, envia só code + message.
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: `🚨 [APROVUS] ${where}\n**${message}**${contextBlock}`,
    }),
    signal: controller.signal,
  })
    .catch((err) => {
      // Não usa reportError aqui (evita recursão); console basta.
      console.error(
        JSON.stringify({
          level: 'error',
          message: '[observability.discord] falha ao enviar alerta',
          context: { detail: err instanceof Error ? err.message : String(err) },
          ts: new Date().toISOString(),
        })
      )
    })
    .finally(() => clearTimeout(timer))
}
