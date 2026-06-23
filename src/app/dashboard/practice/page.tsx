import Link from 'next/link'
import { ArrowRight, HelpCircle } from 'lucide-react'

import { requireTargetFunction } from '@/lib/auth/session'
import { getModulesWithQuestionCount } from '@/lib/supabase/queries'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'

export default async function PracticePage() {
  const profile = await requireTargetFunction()

  const modules = await getModulesWithQuestionCount(profile.target_function)
  const withQuestions = modules.filter((m) => m.totalQuestions > 0)

  return (
    <div className="space-y-8 p-6 md:p-8">
      <PageHeader
        eyebrow="Treino por matéria"
        title="Praticar questões"
        description="Escolha uma matéria e resolva uma rodada com correção e comentário. Cada rodada afina suas recomendações e mostra onde focar."
      />

      {withQuestions.length === 0 ? (
        <p className="text-muted-foreground">
          Ainda não há questões disponíveis para praticar.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withQuestions.map((m) => (
            <Link
              key={m.slug}
              href={`/dashboard/practice/${m.slug}`}
              className="group block"
            >
              <Card className="h-full transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex h-full items-start gap-4 py-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{m.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {m.totalQuestions} questões disponíveis
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
