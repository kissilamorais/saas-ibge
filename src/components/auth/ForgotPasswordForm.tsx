'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // O link do e-mail cai no callback (troca o code por sessão) e segue para
      // a página onde o usuário define a nova senha.
      redirectTo: `${window.location.origin}/auth/callback?redirect=/auth/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Recuperar senha</CardTitle>
          <CardDescription>
            Enviaremos um link para você redefinir sua senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p
              role="status"
              aria-live="polite"
              className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600"
            >
              Se existir uma conta com esse e-mail, você receberá um link para
              redefinir a senha. Verifique sua caixa de entrada.
            </p>
          ) : (
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

              {error && (
                <p
                  role="alert"
                  aria-live="assertive"
                  className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar link
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:underline"
            >
              Voltar para o login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
