/**
 * Sessão de convidado para o funil de trial gratuito.
 *
 * Em vez de criar uma conta no Supabase Auth (que abre VUL-001: identidade
 * confirmada sem prova de posse do e-mail), usamos um cookie httpOnly assinado
 * que carrega os dados mínimos do funil. A conta real só é criada no pagamento,
 * por lib/onboarding/guest.ts.
 *
 * O cookie é ASSINADO, não criptografado: o cliente não consegue forjá-lo nem
 * alterá-lo, mas o conteúdo é legível por quem tiver o token. Por isso só
 * guardamos aqui o que o próprio visitante acabou de digitar — nada de segredo,
 * status de pagamento ou papel de admin. Quem manda no acesso pago continua
 * sendo o RLS do Supabase.
 */

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'trial_session'
const COOKIE_MAX_AGE = 60 * 60 * 2 // 2 horas

function getSecret() {
  const secret = process.env.TRIAL_SESSION_SECRET
  if (!secret) throw new Error('TRIAL_SESSION_SECRET não configurado')
  return new TextEncoder().encode(secret)
}

export interface TrialSessionData {
  leadId: string // UUID do registro em trial_leads
  email: string
  fullName: string
  whatsapp?: string
  cargo?: string
  targetFunction?: string
}

export async function createTrialSession(
  data: TrialSessionData,
  response: NextResponse,
): Promise<void> {
  const token = await new SignJWT({ ...data })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('2h')
    .setIssuedAt()
    .sign(getSecret())

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    // Path '/' e não '/teste': as etapas do funil chamam /api/trial/*, e um
    // cookie preso em /teste não seria enviado para essas rotas.
    path: '/',
  })
}

export async function getTrialSession(): Promise<TrialSessionData | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as TrialSessionData
  } catch {
    // Token ausente, expirado, adulterado ou segredo trocado → sem sessão.
    return null
  }
}

export async function getTrialSessionFromRequest(
  request: NextRequest,
): Promise<TrialSessionData | null> {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as TrialSessionData
  } catch {
    return null
  }
}

export function clearTrialSession(response: NextResponse): void {
  response.cookies.delete(COOKIE_NAME)
}
