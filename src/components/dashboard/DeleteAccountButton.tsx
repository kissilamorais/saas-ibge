'use client'

import { deleteMyAccount } from '@/lib/actions/account'
import { Button } from '@/components/ui/button'

/** Exclui a conta com confirmação, via server action. Ver deleteMyAccount para o escopo do que é apagado. */
export function DeleteAccountButton() {
  return (
    <form
      action={deleteMyAccount}
      onSubmit={(e) => {
        if (
          !confirm(
            'Excluir sua conta apaga seu progresso, respostas e resultados de simulado — não pode ser desfeito. Continuar?',
          )
        ) {
          e.preventDefault()
        }
      }}
    >
      <Button type="submit" variant="destructive" size="sm">
        Excluir minha conta
      </Button>
    </form>
  )
}
