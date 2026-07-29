'use client'

import { useFormState, useFormStatus } from 'react-dom'

import {
  createTestimonial,
  updateTestimonial,
  type ActionState,
} from '@/lib/actions/testimonials'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Testimonial } from '@/types'

const CARGO_OPTIONS = [
  { value: '', label: 'Geral' },
  { value: 'ACA', label: 'ACA' },
  { value: 'ACI', label: 'ACI' },
  { value: 'AOR', label: 'AOR' },
  { value: 'ACR', label: 'ACR' },
  { value: 'ACS', label: 'ACS' },
]

const SOURCE_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'platform', label: 'Plataforma' },
]

const OBJECTION_OPTIONS = [
  { value: '', label: 'Nenhuma' },
  { value: 'quality', label: 'Qualidade' },
  { value: 'price', label: 'Preço' },
  { value: 'trust', label: 'Confiança' },
  { value: 'time', label: 'Tempo' },
  { value: 'specific', label: 'Específico' },
  { value: 'simulator', label: 'Simulado' },
]

const CONTENT_MAX_LEN = 280

const selectClassName = cn(
  'flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
)

const textareaClassName = cn(
  'flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
)

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando…' : label}
    </Button>
  )
}

export function TestimonialForm({
  testimonial,
}: {
  testimonial?: Testimonial
}) {
  const isEdit = Boolean(testimonial)
  const action = isEdit ? updateTestimonial : createTestimonial
  const [state, formAction] = useFormState<ActionState, FormData>(
    action,
    null
  )

  return (
    <form action={formAction} className="space-y-5">
      {isEdit && <input type="hidden" name="id" value={testimonial!.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="author_name">Nome do autor *</Label>
          <Input
            id="author_name"
            name="author_name"
            required
            defaultValue={testimonial?.author_name}
            placeholder="Ex.: Ana"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="author_cargo">Cargo</Label>
          <select
            id="author_cargo"
            name="author_cargo"
            defaultValue={testimonial?.author_cargo ?? ''}
            className={selectClassName}
          >
            {CARGO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content">Depoimento * (máx. {CONTENT_MAX_LEN} caracteres)</Label>
        <textarea
          id="content"
          name="content"
          required
          rows={4}
          maxLength={CONTENT_MAX_LEN}
          defaultValue={testimonial?.content}
          placeholder="O texto do depoimento…"
          className={textareaClassName}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="source">Origem</Label>
          <select
            id="source"
            name="source"
            defaultValue={testimonial?.source ?? 'whatsapp'}
            className={selectClassName}
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="objection_tag">Objeção que quebra</Label>
          <select
            id="objection_tag"
            name="objection_tag"
            defaultValue={testimonial?.objection_tag ?? ''}
            className={selectClassName}
          >
            {OBJECTION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="display_order">Ordem de exibição</Label>
          <Input
            id="display_order"
            name="display_order"
            type="number"
            defaultValue={testimonial?.display_order ?? undefined}
            placeholder="1"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="image_url">URL do print (opcional)</Label>
        <Input
          id="image_url"
          name="image_url"
          type="url"
          defaultValue={testimonial?.image_url ?? undefined}
          placeholder="https://…"
        />
        <p className="text-xs text-muted-foreground">
          Upload manual pelo Supabase Dashboard (bucket{' '}
          <code>testimonials</code>) — cole a URL pública aqui.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_active"
          name="is_active"
          type="checkbox"
          defaultChecked={testimonial?.is_active ?? false}
          className="h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Ativo na landing
        </Label>
      </div>

      <div className="flex items-center justify-between gap-4">
        {state && (
          <p
            className={cn(
              'text-sm',
              state.ok ? 'text-success' : 'text-destructive'
            )}
          >
            {state.message}
          </p>
        )}
        <div className="ml-auto">
          <SubmitButton label={isEdit ? 'Salvar alterações' : 'Criar depoimento'} />
        </div>
      </div>
    </form>
  )
}
