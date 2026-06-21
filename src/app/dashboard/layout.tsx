import { Sidebar } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'

/**
 * Shell das rotas de estudo: sidebar (desktop) / topbar (mobile) + conteúdo +
 * footer. O acesso continua garantido pelo middleware e por
 * requireActiveSubscription() em cada página de conteúdo pago.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  )
}
