import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types'

/**
 * Client Supabase com a service_role — ignora RLS.
 * USO ESTRITO no servidor (webhook/ativação). Nunca importar em Client Components.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
