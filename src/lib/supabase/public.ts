import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types'

/**
 * Client Supabase anônimo, sem tocar em cookies/sessão da requisição.
 * `server.ts` usa `cookies()`, o que força a rota inteira a renderizar em
 * modo dinâmico — inaceitável para a landing, que depende de ISR
 * (`revalidate`) para o preço da oferta não congelar no build. Use este
 * client só para leituras públicas (RLS de leitura sem auth), nunca para
 * dados de usuário logado.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}
