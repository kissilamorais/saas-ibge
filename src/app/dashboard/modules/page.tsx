import { requireTargetFunction } from '@/lib/auth/session'
import {
  getCompletedLessons,
  getModulesWithLessonCount,
} from '@/lib/supabase/queries'
import {
  ModuleCard,
  type ModuleCardData,
} from '@/components/modules/ModuleCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export default async function ModulesPage() {
  const profile = await requireTargetFunction()

  const [mods, progress] = await Promise.all([
    getModulesWithLessonCount(profile.target_function),
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
      <PageHeader
        eyebrow="Seu edital"
        title="Módulos"
        description={`${modules.length} módulos • ${completedLessons} de ${totalLessons} lições concluídas`}
        aside={
          <Card className="w-full p-4 sm:w-56">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Edital concluído
              </span>
              <span className="font-display text-lg font-semibold tabular-nums">
                {overallPercent}%
              </span>
            </div>
            <Progress value={overallPercent} className="mt-2" />
          </Card>
        }
      />

      {/* Grid de módulos */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard key={module.slug} module={module} />
        ))}
      </div>
    </div>
  )
}
