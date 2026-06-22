'use client'

import { revokeComplimentary } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'

/** Revoga uma cortesia com confirmação, via server action. */
export function RevokeButton({ id }: { id: string }) {
  return (
    <form
      action={revokeComplimentary}
      onSubmit={(e) => {
        if (!confirm('Revogar o acesso de cortesia deste e-mail?')) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm" className="text-destructive">
        Revogar
      </Button>
    </form>
  )
}
