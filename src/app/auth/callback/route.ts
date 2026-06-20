import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

/**
 * Recebe o redirect do Supabase após confirmação de e-mail / magic link
 * e troca o `code` por uma sessão (cookies).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth`)
}
