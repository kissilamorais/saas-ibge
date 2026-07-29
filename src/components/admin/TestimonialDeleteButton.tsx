'use client'

import { deleteTestimonial } from '@/lib/actions/testimonials'
import { Button } from '@/components/ui/button'

/** Remove um depoimento com confirmação, via server action. */
export function TestimonialDeleteButton({ id }: { id: string }) {
  return (
    <form
      action={deleteTestimonial}
      onSubmit={(e) => {
        if (!confirm('Excluir este depoimento? Não pode ser desfeito.')) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm" className="text-destructive">
        Excluir
      </Button>
    </form>
  )
}
