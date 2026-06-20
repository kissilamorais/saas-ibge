import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Check } from 'lucide-react'

import { CheckoutButton } from '@/components/checkout/CheckoutButton'
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Libere seu acesso</CardTitle>
          <CardDescription>
            Pagamento único de R$97 — sem mensalidade.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">R$97</span>
            <span className="text-muted-foreground">à vista</span>
          </div>

          <ul className="space-y-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {searchParams.canceled && (
            <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-600">
              Pagamento cancelado. Você pode tentar novamente quando quiser.
            </p>
          )}

          <CheckoutButton />

          <p className="text-center text-xs text-muted-foreground">
            Pagamento processado com segurança pela Stripe.{' '}
            <Link href="/dashboard" className="underline">
              Voltar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
