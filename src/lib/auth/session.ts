import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'
import { isSubscriptionActive } from '@/lib/auth/subscription'
import type { UserProfile } from '@/types'

/**
 * Helpers de sessão/assinatura para Server Components e Route Handlers.
 *
 * Gate de acesso (mantém paridade com as policies de RLS): conteúdo pago exige
 * `profiles.subscription_status = 'active'`. O middleware já garante que rotas
 * sob /dashboard e /checkout só são acessíveis com usuário logado; estas
 * funções acrescentam a checagem de assinatura nas páginas de conteúdo pago.
 */

/**
 * Usuário autenticado da requisição. `cache()` (React) deduplica as chamadas
 * dentro do mesmo render/route handler: vários helpers chamam getUser() na mesma
 * página (dashboard chega a 4x), mas o supabase.auth.getUser() — que valida o
 * JWT no servidor de Auth — só roda uma vez por request.
 */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export const getProfile = cache(async (): Promise<UserProfile | null> => {
  const user = await getUser()
  if (!user) return null

  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return (data as UserProfile | null) ?? null
})

export function hasActiveSubscription(profile: UserProfile | null): boolean {
  return isSubscriptionActive(profile?.subscription_status)
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

/**
 * Como requireActiveSubscription, mas também exige que o candidato já tenha
 * escolhido a função-alvo (trilha). Sem escolha → onboarding. Usado pelas
 * páginas de conteúdo, que filtram o catálogo por `target_function`.
 */
export async function requireTargetFunction(): Promise<UserProfile> {
  const profile = await requireActiveSubscription()
  if (!profile.target_function) redirect('/dashboard/onboarding')
  return profile
}
