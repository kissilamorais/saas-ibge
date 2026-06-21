import Link from 'next/link'
import { ArrowRight, HelpCircle } from 'lucide-react'

import { requireActiveSubscription } from '@/lib/auth/session'
import { getModulesWithQuestionCount } from '@/lib/supabase/queries'
import { Card, CardContent } from '@/components/ui/card'

export default async function PracticePage() {
  await requireActiveSubscription()

  const modules = await getModulesWithQuestionCount()
  const withQuestions = modules.filter((m) => m.totalQuestions > 0)

  return (
    <div className="space-y-8 p-6 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Praticar questões</h1>
        <p className="text-muted-foreground">
          Escolha uma matéria e resolva uma rodada de questões com correção e
          comentário. Seu desempenho alimenta as recomendações da dashboard.
        </p>
      </div>

      {withQuestions.length === 0 ? (
        <p className="text-muted-foreground">
          Ainda não há questões disponíveis para praticar.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withQuestions.map((m) => (
            <Link key={m.slug} href={`/dashboard/practice/${m.slug}`}>
              <Card className="h-full transition-colors hover:bg-accent">
                <CardContent className="flex h-full items-start gap-4 py-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{m.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {m.totalQuestions} questões disponíveis
                    </p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
