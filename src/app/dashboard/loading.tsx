import { Loader2 } from 'lucide-react'

import { Logo } from '@/components/layout/Logo'

/**
 * Loading calmo das rotas de estudo — marca + spinner sereno, em vez de tela
 * branca. Aparece enquanto os Server Components buscam dados.
 */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <Logo />
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Preparando seu estudo…</p>
    </div>
  )
}
