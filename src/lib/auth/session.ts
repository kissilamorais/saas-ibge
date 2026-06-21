import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/types'

/**
 * Helpers de sessão/assinatura para Server Components e Route Handlers.
 *
 * Gate de acesso (mantém paridade com as policies de RLS): conteúdo pago exige
 * `profiles.subscription_status = 'active'`. O middleware já garante que rotas
 * sob /dashboard e /checkout só são acessíveis com usuário logado; estas
 * funções acrescentam a checagem de assinatura nas páginas de conteúdo pago.
 */

export async function getUser(): Promise<User | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return (data as UserProfile | null) ?? null
}

export function hasActiveSubscription(profile: UserProfile | null): boolean {
  return profile?.subscription_status === 'active'
}

/** Exige usuário logado; senão redireciona ao login preservando o destino. */
export async function requireUser(redirectTo = '/dashboard'): Promise<User> {
  const user = await getUser()
  if (!user) redirect(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`)
  return user
}

/**
 * Exige assinatura ativa. Sem login → /auth/login; logado sem acesso → /checkout.
 * Retorna o profile para reuso na página.
 */
export async function requireActiveSubscription(): Promise<UserProfile> {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login')
  if (!hasActiveSubscription(profile)) redirect('/checkout')
  return profile
}
