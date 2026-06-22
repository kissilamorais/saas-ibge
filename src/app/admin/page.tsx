import { requireAdmin } from '@/lib/auth/session'

export const metadata = { title: 'Admin · Aprovus' }

/**
 * Placeholder da Visão Geral (KPIs + gráficos) — será construído na Etapa 2.
 * Mantém a rota viva e a proteção de admin ativa desde a fundação.
 */
export default async function AdminOverviewPage() {
  const admin = await requireAdmin()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Painel do administrador
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Bem-vindo, {admin.full_name || admin.email}. As seções (Visão geral,
        Leads e Parceiros) serão construídas nas próximas etapas.
      </p>
    </div>
  )
}
