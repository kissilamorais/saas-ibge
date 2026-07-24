import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate limiting por IP para as rotas críticas de pagamento. Dois backends:
 *
 *   - REDIS (produção correta): se houver Upstash Redis OU Vercel KV
 *     configurado (variáveis de ambiente abaixo). Janela deslizante,
 *     compartilhada entre todas as instâncias serverless.
 *   - MEMÓRIA (fallback): se não houver Redis. Janela fixa, POR INSTÂNCIA —
 *     em serverless cada função tem sua própria memória e cold starts zeram o
 *     contador, então protege muito menos. Serve para não ficar sem NENHUM
 *     limite, mas o correto em produção é configurar o Redis (ver README/env).
 *
 * Variáveis aceitas (qualquer um dos pares):
 *   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN   (Upstash)
 *   KV_REST_API_URL        + KV_REST_API_TOKEN          (Vercel KV)
 */

const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN

const redis =
  redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null

/** Qual backend está ativo — útil para logar/avisar em produção. */
export const RATE_LIMIT_BACKEND: 'redis' | 'memory' = redis ? 'redis' : 'memory'

export interface RateLimitResult {
  success: boolean
  remaining: number
  backend: 'redis' | 'memory'
}

// --- backend Redis (Upstash sliding window), um limiter por (nome,max,janela) ---
const limiters = new Map<string, Ratelimit>()
function upstashLimiter(name: string, max: number, windowSec: number): Ratelimit {
  const key = `${name}:${max}:${windowSec}`
  let l = limiters.get(key)
  if (!l) {
    l = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
      prefix: `rl:${name}`,
      analytics: false,
    })
    limiters.set(key, l)
  }
  return l
}

// --- backend memória (janela fixa por instância) ---
interface Bucket {
  count: number
  resetAt: number
}
const memBuckets = new Map<string, Bucket>()

function memLimit(
  name: string,
  id: string,
  max: number,
  windowSec: number,
): RateLimitResult {
  const now = Date.now()

  // Poda oportunista para não crescer sem limite (buckets já expirados).
  if (memBuckets.size > 5000) {
    for (const [k, v] of memBuckets) {
      if (now >= v.resetAt) memBuckets.delete(k)
    }
  }

  const key = `${name}:${id}`
  const bucket = memBuckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    memBuckets.set(key, { count: 1, resetAt: now + windowSec * 1000 })
    return { success: true, remaining: max - 1, backend: 'memory' }
  }
  if (bucket.count >= max) {
    return { success: false, remaining: 0, backend: 'memory' }
  }
  bucket.count += 1
  return { success: true, remaining: max - bucket.count, backend: 'memory' }
}

/**
 * Consome 1 do limite `name` para o identificador `id` (use o IP). Nunca lança:
 * se o Redis falhar, cai no limiter em memória — um problema de infra de rate
 * limit não pode derrubar o checkout/webhook.
 */
export async function rateLimit(
  name: string,
  id: string,
  max: number,
  windowSec: number,
): Promise<RateLimitResult> {
  if (redis) {
    try {
      const r = await upstashLimiter(name, max, windowSec).limit(id)
      return { success: r.success, remaining: r.remaining, backend: 'redis' }
    } catch {
      return memLimit(name, id, max, windowSec)
    }
  }
  return memLimit(name, id, max, windowSec)
}

/** Primeiro IP de `x-forwarded-for` (o real); fallback estável se ausente. */
export function clientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  const ip = xff?.split(',')[0]?.trim()
  return ip || 'unknown'
}
