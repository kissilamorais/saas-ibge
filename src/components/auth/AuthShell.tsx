import type { ReactNode } from 'react'
import Link from 'next/link'

import { Logo } from '@/components/layout/Logo'

/**
 * Moldura das telas de acesso (login, cadastro, recuperação de senha e
 * checkout). Marca Aprovus no topo + um clarão teal suave — a mesma "sala de
 * estudos bem iluminada" da landing, para a entrada não ficar fria/genérica.
 * Server-safe (sem estado), então serve tanto para os forms client quanto para
 * o checkout server.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.10),_transparent_70%)]"
      />
      <Link
        href="/"
        className="relative mb-7 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Aprovus — página inicial"
      >
        <Logo />
      </Link>
      <div className="relative flex w-full justify-center">{children}</div>
    </div>
  )
}
