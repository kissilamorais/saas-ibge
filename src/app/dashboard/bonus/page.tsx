import { PageHeader } from '@/components/layout/PageHeader'
import { BonusesSection } from '@/components/dashboard/BonusesSection'
import { getBonusViews } from '@/lib/bonuses/access'
import { requireActiveSubscription } from '@/lib/auth/session'

/**
 * Índice dos bônus. Exige acesso pago (o gate temporal é por bônus, dentro da
 * seção). Reusa a mesma BonusesSection do dashboard como fonte única de UI.
 */
export default async function BonusIndexPage() {
  await requireActiveSubscription()
  const bonuses = await getBonusViews()

  return (
    <div className="space-y-6 p-6 md:p-8">
      <PageHeader
        eyebrow="Extras"
        title="Bônus da jornada"
        description="Materiais e acessos que liberam ao longo da sua preparação."
      />
      <BonusesSection bonuses={bonuses} />
    </div>
  )
}
