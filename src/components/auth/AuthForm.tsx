'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '@/components/auth/AuthShell'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface AuthFormProps {
  mode: 'login' | 'signup'
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>
    if (typeof e.message === 'string' && e.message) return e.message
    if (typeof e.error_description === 'string' && e.error_description)
      return e.error_description
  }
  if (typeof err === 'string' && err) return err
  return 'Ocorreu um erro. Tente novamente.'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isLogin = mode === 'login'

  // Captura de origem (UTM): se vier na URL, persiste para usar no cadastro
  // (mesmo que a pessoa navegue por algumas páginas antes de criar a conta).
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const
  useEffect(() => {
    const fromUrl: Record<string, string> = {}
    for (const k of UTM_KEYS) {
      const v = searchParams.get(k)
      if (v) fromUrl[k] = v
    }
    if (Object.keys(fromUrl).length > 0) {
      try {
        localStorage.setItem('aprovus_utm', JSON.stringify(fromUrl))
      } catch {
        /* localStorage indisponível: ignora */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function getUtmData(): Record<string, string> {
    const data: Record<string, string> = {}
    for (const k of UTM_KEYS) {
      const v = searchParams.get(k)
      if (v) data[k] = v
    }
    if (Object.keys(data).length === 0) {
      try {
        const stored = localStorage.getItem('aprovus_utm')
        if (stored) return JSON.parse(stored) as Record<string, string>
      } catch {
        /* ignora */
      }
    }
    return data
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push(redirectTo)
        router.refresh()
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
            // Origem (UTM) → user_metadata; o trigger handle_new_user copia
            // para profiles.utm_* no cadastro.
            data: getUtmData(),
          },
        })
        if (error) throw error

        // Se a confirmação de e-mail estiver desativada, já vem sessão → entra direto
        if (data.session) {
          router.push(redirectTo)
          router.refresh()
        } else {
          setMessage(
            'Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de entrar.'
          )
        }
      }
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-sm shadow-md">
        <CardHeader className="space-y-1">
          <CardTitle className="font-display text-2xl font-semibold">
            {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? 'Entre para continuar de onde parou.'
              : 'Leva um minuto — e seu progresso fica salvo para sempre.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="voce@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="text-right">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
            )}

            {error && (
              <p
                role="alert"
                aria-live="assertive"
                className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            {message && (
              <p
                role="status"
                aria-live="polite"
                className="rounded-md bg-success/10 px-3 py-2 text-sm text-success"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLogin ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isLogin ? (
              <>
                Não tem conta?{' '}
                <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                  Cadastre-se
                </Link>
              </>
            ) : (
              <>
                Já tem conta?{' '}
                <Link href="/auth/login" className="font-medium text-primary hover:underline">
                  Entrar
                </Link>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
