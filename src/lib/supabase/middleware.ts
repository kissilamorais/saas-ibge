import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Atualiza/renova a sessão do Supabase a cada requisição e protege rotas.
 * Padrão oficial @supabase/ssr para Next.js App Router.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: não rode lógica entre createServerClient e getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  // Rotas de checkout que precisam ser públicas: o retorno do pagamento
  // (`/checkout/success`) e a confirmação do fluxo guest (`/checkout/obrigado`)
  // são acessadas por quem AINDA não tem sessão (comprou sem conta). Sem esta
  // exceção o middleware jogaria o comprador pago para o login.
  const isCheckoutPublic =
    path.startsWith('/checkout/success') ||
    path.startsWith('/checkout/obrigado')
  const isProtected =
    !isCheckoutPublic &&
    (path.startsWith('/dashboard') ||
      path.startsWith('/checkout') ||
      path.startsWith('/admin'))

  // Sem usuário tentando acessar rota protegida → manda pro login
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  // Usuário logado em página de auth → manda pro dashboard.
  // Exceções: reset-password (chega-se a ela JÁ logado via sessão de recovery)
  // e signout (precisa rodar para encerrar a sessão).
  const authException =
    path.startsWith('/auth/reset-password') ||
    path.startsWith('/auth/signout')
  if (user && path.startsWith('/auth') && !authException) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
