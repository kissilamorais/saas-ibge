import { requireActiveSubscription } from '@/lib/auth/session'
import {
  getCompletedLessons,
  getModulesWithLessonCount,
} from '@/lib/supabase/queries'
import {
  ModuleCard,
  type ModuleCardData,
} from '@/components/modules/ModuleCard'

export default async function ModulesPage() {
  await requireActiveSubscription()

  const [mods, progress] = await Promise.all([
    getModulesWithLessonCount(),
    getCompletedLessons(),
  ])
  const modules: ModuleCardData[] = mods.map((m) => ({
    slug: m.slug,
    title: m.title,
    description: m.description,
    icon: m.icon,
    completedLessons: progress.byModule.get(m.id) ?? 0,
    totalLessons: m.totalLessons,
  }))

  const totalLessons = modules.reduce((sum, m) => sum + m.totalLessons, 0)
  const completedLessons = modules.reduce(
    (sum, m) => sum + m.completedLessons,
    0
  )
  const overallPercent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <div className="space-y-8 p-6 md:p-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Módulos</h1>
        <p className="text-muted-foreground">
          {modules.length} módulos • {completedLessons} de {totalLessons} lições
          concluídas ({overallPercent}%)
        </p>
      </div>

      {/* Grid de módulos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard key={module.slug} module={module} />
        ))}
      </div>
    </div>
  )
}
