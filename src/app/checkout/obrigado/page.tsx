import Link from 'next/link'
import type { Metadata } from 'next'
import { CheckCircle2, Mail } from 'lucide-react'

import { AuthShell } from '@/components/auth/AuthShell'
import { GuestPurchaseTracker } from '@/components/analytics/GuestPurchaseTracker'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Pagamento confirmado — Aprovus',
  robots: { index: false, follow: false },
}

/**
 * Página de obrigado do fluxo guest (compra sem conta). Chegamos aqui pela
 * success route SÓ quando o pagamento foi confirmado na Stripe. Mostra a
 * mensagem de sucesso e dispara o Purchase do pixel (uma vez, via
 * GuestPurchaseTracker). A criação da conta e o e-mail de "definir senha"
 * são feitos pelo webhook da Stripe.
 */
export default function ObrigadoPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  return (
    <AuthShell>
      <GuestPurchaseTracker sessionId={searchParams.session_id} />
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-display text-2xl font-semibold">
            Pagamento confirmado! ✅
          </CardTitle>
          <CardDescription>
            Seu acesso ao Aprovus está garantido.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-secondary-foreground">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>
              Enviamos um e-mail para você{' '}
              <strong className="font-semibold">definir sua senha</strong> e
              acessar o Aprovus. Confira sua caixa de entrada (e o{' '}
              <strong className="font-semibold">spam</strong>).
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Já definiu sua senha?{' '}
            <Link href="/auth/login" className="underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
