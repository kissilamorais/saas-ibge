import { cache } from 'react'
import { notFound, redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isSubscriptionActive } from '@/lib/auth/subscription'
import { isAdminEmail } from '@/lib/auth/admin'
import type { UserProfile } from '@/types'

/**
 * Helpers de sessão/assinatura para Server Components e Route Handlers.
 *
 * Gate de acesso (mantém paridade com as policies de RLS): conteúdo pago exige
 * assinatura ativa OU cortesia de parceiro válida (ver hasContentAccess). O
 * middleware já garante que rotas sob /dashboard e /checkout só são acessíveis
 * com usuário logado; estas funções acrescentam a checagem de acesso nas
 * páginas de conteúdo pago.
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

/**
 * Acesso ao conteúdo pago do usuário logado: assinatura ativa OU cortesia de
 * parceiro válida. Fonte única de verdade compartilhada com o RLS — chama a
 * função SQL `current_user_has_content_access()` (mesma lógica de
 * `private.has_content_access()`), em vez de duplicar a regra de cortesia no TS.
 * `cache()` deduplica dentro do mesmo render.
 */
export const hasContentAccess = cache(async (): Promise<boolean> => {
  const user = await getUser()
  if (!user) return false

  const supabase = createClient()
  const { data, error } = await supabase.rpc('current_user_has_content_access')
  if (error) return false
  return data === true
})

/**
 * True se o usuário logado é admin. Duas fontes: a coluna `profiles.is_admin`
 * (promoções manuais) OU a allowlist em env `ADMIN_EMAILS` (verificada no
 * servidor). A allowlist permite virar admin já no 1º login, sem passo manual.
 */
export const isAdmin = cache(async (): Promise<boolean> => {
  const profile = await getProfile()
  return profile?.is_admin === true || isAdminEmail(profile?.email)
})

/**
 * Promove a admin no banco (service_role) quem está na allowlist mas ainda tem
 * is_admin=false — assim o RLS e `private.is_admin()` ficam coerentes com a env.
 * Idempotente; só escreve quando necessário.
 */
async function syncAllowlistedAdmin(profile: UserProfile): Promise<void> {
  if (profile.is_admin || !isAdminEmail(profile.email)) return
  const admin = createAdminClient()
  await admin.from('profiles').update({ is_admin: true }).eq('id', profile.id)
}

/**
 * Exige admin. Sem login → /auth/login; logado sem ser admin → 404 (não revela
 * a existência do painel). Use no topo de toda página/rota sob /admin.
 * Admin pela allowlist é promovido no banco na 1ª passagem.
 */
export async function requireAdmin(): Promise<UserProfile> {
  const profile = await getProfile()
  if (!profile) redirect('/auth/login?redirect=/admin')
  if (!(profile.is_admin || isAdminEmail(profile.email))) notFound()
  await syncAllowlistedAdmin(profile)
  return profile
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
  if (!(await hasContentAccess())) redirect('/checkout')
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
