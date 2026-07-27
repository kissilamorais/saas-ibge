import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { clientIp, rateLimit } from '@/lib/rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Cria a conta do teste gratuito já confirmada e devolve a senha gerada no
 * servidor para o cliente logar na hora — o funil não sobrevive a um desvio
 * para a caixa de entrada.
 *
 * A senha só é devolvida para contas criadas agora. Se o e-mail já existe,
 * responde 409: resetar a senha de uma conta alheia a partir do e-mail seria
 * takeover de qualquer aluno pagante.
 */
export async function POST(request: Request) {
  const rl = await rateLimit('trial-signup', clientIp(request), 5, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um instante e tente de novo.' },
      { status: 429 },
    )
  }

  const body = (await request.json().catch(() => null)) as {
    email?: unknown
    full_name?: unknown
    whatsapp?: unknown
  } | null

  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const fullName =
    typeof body?.full_name === 'string' ? body.full_name.trim() : ''
  const whatsapp =
    typeof body?.whatsapp === 'string' ? body.whatsapp.replace(/\D/g, '') : ''

  if (!EMAIL_RE.test(email) || fullName.length < 2) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }
  if (whatsapp.length < 10 || whatsapp.length > 11) {
    return NextResponse.json(
      { error: 'Digite um WhatsApp válido com DDD.' },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  const password = randomUUID() + randomUUID()

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, whatsapp, _trial: 'true' },
  })

  if (error) {
    const alreadyExists =
      error.status === 422 || /already|exist|registered/i.test(error.message)
    if (alreadyExists) {
      return NextResponse.json(
        { error: 'Esse e-mail já tem conta. Entre com sua senha para continuar.' },
        { status: 409 },
      )
    }
    console.error('[trial/signup] createUser falhou:', error.message)
    return NextResponse.json(
      { error: 'Não foi possível criar sua conta. Tente de novo.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ email, password })
}
