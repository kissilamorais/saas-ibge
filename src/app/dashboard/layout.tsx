import { Sidebar } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'
import { isAdmin } from '@/lib/auth/session'

/**
 * Shell das rotas de estudo: sidebar (desktop) / topbar (mobile) + conteúdo +
 * footer. O acesso continua garantido pelo middleware e por
 * requireActiveSubscription() em cada página de conteúdo pago.
 *
 * isAdmin é resolvido no SERVIDOR e passado à Sidebar (client) só como flag de
 * UI — o gate real do /admin continua no requireAdmin() do servidor.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await isAdmin()

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar isAdmin={admin} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  )
}
