import Link from 'next/link'

import { requireAdmin } from '@/lib/auth/session'
import { getAllTestimonials } from '@/lib/admin/testimonials'
import { TestimonialToggleButton } from '@/components/admin/TestimonialToggleButton'
import { TestimonialDeleteButton } from '@/components/admin/TestimonialDeleteButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const metadata = { title: 'Depoimentos · Admin · Aprovus' }
export const dynamic = 'force-dynamic'

const OBJECTION_LABEL: Record<string, string> = {
  quality: 'Qualidade',
  price: 'Preço',
  trust: 'Confiança',
  time: 'Tempo',
  specific: 'Específico',
  simulator: 'Simulado',
}

export default async function AdminTestimonialsPage() {
  await requireAdmin()
  const testimonials = await getAllTestimonials()
  const activeCount = testimonials.filter((t) => t.is_active).length

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Depoimentos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Prova social da landing — curadoria manual. {activeCount} de{' '}
            {testimonials.length} ativo(s) na landing agora.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/testimonials/new">Novo depoimento</Link>
        </Button>
      </header>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Todos os depoimentos
          </CardTitle>
          <CardDescription>
            {testimonials.length === 0
              ? 'Nenhum depoimento ainda.'
              : `${testimonials.length} registro(s).`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {testimonials.length === 0 ? (
            <div className="mx-6 flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Adicione o primeiro depoimento acima.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Autor</TableHead>
                  <TableHead>Depoimento</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Objeção</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testimonials.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-foreground">
                      {t.author_name}
                      {t.author_cargo && (
                        <span className="block text-xs text-muted-foreground">
                          {t.author_cargo}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {t.content}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.source}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.objection_tag
                        ? OBJECTION_LABEL[t.objection_tag] ?? t.objection_tag
                        : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t.display_order ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.is_active ? 'success' : 'muted'}>
                        {t.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/testimonials/${t.id}`}>
                            Editar
                          </Link>
                        </Button>
                        <TestimonialToggleButton
                          id={t.id}
                          isActive={t.is_active}
                        />
                        <TestimonialDeleteButton id={t.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
