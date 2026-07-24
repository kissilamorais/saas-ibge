import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Check, Infinity as InfinityIcon } from 'lucide-react'

import { CheckoutButton } from '@/components/checkout/CheckoutButton'
import { PixelEvent } from '@/components/analytics/PixelEvent'
import { AuthShell } from '@/components/auth/AuthShell'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

const BENEFITS = [
  'Acesso vitalício a todos os módulos e lições',
  'Banco com 1000+ questões comentadas',
  '8 simulados completos no estilo da prova',
  'Dashboard de desempenho e revisões',
]

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { canceled?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware já protege, mas garantimos:
  if (!user) redirect('/auth/login?redirect=/checkout')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .maybeSingle()
  const profile = profileData as { subscription_status: string | null } | null

  if (profile?.subscription_status === 'active') redirect('/dashboard')

  return (
    <AuthShell>
      <PixelEvent
        event="ViewContent"
        params={{
          content_name: 'Aprovus — Acesso vitalício',
          value: 97,
          currency: 'BRL',
        }}
      />
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle className="font-display text-2xl font-semibold">
            Libere seu acesso
          </CardTitle>
          <CardDescription>
            Você está a um passo de estudar com método.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold-soft px-3 py-1 text-sm font-medium text-gold">
              <InfinityIcon className="h-4 w-4" />
              Acesso vitalício
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-4xl font-semibold">R$97</span>
              <span className="text-muted-foreground">à vista, uma vez só</span>
            </div>
          </div>

          <ul className="space-y-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {searchParams.canceled && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Pagamento cancelado. Você pode tentar novamente quando quiser.
            </p>
          )}

          <CheckoutButton />

          <p className="text-center text-xs text-muted-foreground">
            Pagamento processado com segurança pela InfinitePay.{' '}
            <Link href="/dashboard" className="underline">
              Voltar
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
