import { createBrowserClient } from '@supabase/ssr'

import type { Database } from '@/types'

/**
 * Client Supabase para uso em Client Components ('use client').
 * Lê as variáveis públicas (NEXT_PUBLIC_*) em runtime.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
