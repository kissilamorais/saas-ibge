'use client'

import { useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'

import { grantComplimentary, type ActionState } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Concedendo…' : 'Conceder acesso'}
    </Button>
  )
}

export function PartnerGrantForm() {
  const [state, formAction] = useFormState<ActionState, FormData>(
    grantComplimentary,
    null
  )
  const formRef = useRef<HTMLFormElement>(null)

  // Limpa o formulário após sucesso.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail do parceiro *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="parceiro@email.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expires_at">Validade (opcional)</Label>
          <Input id="expires_at" name="expires_at" type="date" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Quem é / observação (opcional)</Label>
        <Input
          id="note"
          name="note"
          placeholder="Ex.: influencer parceiro, beta tester…"
        />
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
          <SubmitButton />
        </div>
      </div>
    </form>
  )
}
