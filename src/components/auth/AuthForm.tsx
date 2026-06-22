'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
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
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const isLogin = mode === 'login'

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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="font-display text-2xl font-semibold">
            {isLogin ? 'Entrar' : 'Criar conta'}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? 'Acesse sua conta para continuar estudando.'
              : 'Crie sua conta para começar a estudar.'}
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
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Mínimo 6 caracteres"
              />
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
    </div>
  )
}
