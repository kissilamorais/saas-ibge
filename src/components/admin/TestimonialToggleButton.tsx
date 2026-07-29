'use client'

import { toggleTestimonialActive } from '@/lib/actions/testimonials'
import { Button } from '@/components/ui/button'

/** Ativa/desativa um depoimento na landing, via server action. */
export function TestimonialToggleButton({
  id,
  isActive,
}: {
  id: string
  isActive: boolean
}) {
  return (
    <form action={toggleTestimonialActive}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="next_active" value={String(!isActive)} />
      <Button type="submit" variant="outline" size="sm">
        {isActive ? 'Desativar' : 'Ativar'}
      </Button>
    </form>
  )
}
