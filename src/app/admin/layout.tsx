import { requireAdmin } from '@/lib/auth/session'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

/**
 * Shell do painel de administrador. O acesso é verificado NO SERVIDOR:
 * requireAdmin() redireciona quem não está logado e devolve 404 para quem
 * está logado mas não é admin (não revela a existência do painel). O
 * middleware já barra acesso não-autenticado a /admin.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1 bg-background">{children}</main>
    </div>
  )
}
