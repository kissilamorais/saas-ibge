import { notFound } from 'next/navigation'

import { requireAdmin } from '@/lib/auth/session'
import { getTestimonialById } from '@/lib/admin/testimonials'
import { TestimonialForm } from '@/components/admin/TestimonialForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export const metadata = { title: 'Editar depoimento · Admin · Aprovus' }
export const dynamic = 'force-dynamic'

export default async function EditTestimonialPage(props: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const params = await props.params
  const testimonial = await getTestimonialById(params.id)
  if (!testimonial) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Editar depoimento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {testimonial.author_name}
          {testimonial.author_cargo ? ` · ${testimonial.author_cargo}` : ''}
        </p>
      </header>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Detalhes</CardTitle>
          <CardDescription>Campos com * são obrigatórios.</CardDescription>
        </CardHeader>
        <CardContent>
          <TestimonialForm testimonial={testimonial} />
        </CardContent>
      </Card>
    </div>
  )
}
