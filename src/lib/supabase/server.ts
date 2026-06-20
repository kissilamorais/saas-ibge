import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

import type { Database } from '@/types'

/**
 * Client Supabase para Server Components, Route Handlers e Server Actions.
 * Usa os cookies da requisição (necessário para sessões de auth — item 3).
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // `setAll` chamado de um Server Component — ignorável quando há
            // middleware atualizando a sessão (será adicionado no item 3).
          }
        },
      },
    }
  )
}
