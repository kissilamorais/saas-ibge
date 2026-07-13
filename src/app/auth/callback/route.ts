import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'

/**
 * Recebe o redirect do Supabase após confirmação de e-mail / magic link /
 * recuperação de senha e cria a sessão (cookies). Trata os dois formatos de
 * link que o Supabase Auth pode enviar:
 *  - PKCE (`?code=...`): confirmação de e-mail, OAuth, magic link novo.
 *  - token_hash (`?token_hash=...&type=recovery|magiclink|signup|...`): usado
 *    pelo e-mail de `resetPasswordForEmail` (definir senha).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const supabase = createClient()

  if (code) {
    // Fluxo PKCE: troca o `code` por uma sessão.
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  } else if (tokenHash && type) {
    // Fluxo token_hash (recovery/magiclink/signup/...): verifica o OTP do link.
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth`)
}
