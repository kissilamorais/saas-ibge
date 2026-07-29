import { requireAdmin } from '@/lib/auth/session'
import { TestimonialForm } from '@/components/admin/TestimonialForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata = { title: 'Novo depoimento · Admin · Aprovus' }
export const dynamic = 'force-dynamic'

export default async function NewTestimonialPage() {
  await requireAdmin()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Novo depoimento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fica inativo até você marcar &quot;Ativo na landing&quot;.
        </p>
      </header>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Detalhes</CardTitle>
          <CardDescription>Campos com * são obrigatórios.</CardDescription>
        </CardHeader>
        <CardContent>
          <TestimonialForm />
        </CardContent>
      </Card>
    </div>
  )
}
