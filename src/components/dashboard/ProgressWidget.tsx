import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export interface ModuleProgress {
  id: string
  name: string
  /** Lições concluídas */
  completedLessons: number
  /** Total de lições do módulo */
  totalLessons: number
}

interface ProgressWidgetProps {
  modules?: ModuleProgress[]
}

// TODO: substituir por dados reais do Supabase (modules + progress do usuário)
const mockModules: ModuleProgress[] = [
  { id: 'portugues', name: 'Português', completedLessons: 12, totalLessons: 15 },
  {
    id: 'raciocinio-logico',
    name: 'Raciocínio Lógico',
    completedLessons: 6,
    totalLessons: 10,
  },
  {
    id: 'administracao',
    name: 'Administração',
    completedLessons: 8,
    totalLessons: 14,
  },
  {
    id: 'informatica',
    name: 'Informática',
    completedLessons: 4,
    totalLessons: 9,
  },
  {
    id: 'conhecimentos-tecnicos',
    name: 'Conhecimentos Técnicos',
    completedLessons: 3,
    totalLessons: 12,
  },
]

export function ProgressWidget({ modules = mockModules }: ProgressWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Progresso por módulo</CardTitle>
        <CardDescription>
          Lições concluídas em cada matéria do edital
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {modules.map((mod) => {
          const percent =
            mod.totalLessons > 0
              ? Math.round((mod.completedLessons / mod.totalLessons) * 100)
              : 0

          return (
            <div key={mod.id} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{mod.name}</span>
                <span className="text-muted-foreground">
                  {mod.completedLessons}/{mod.totalLessons} ({percent}%)
                </span>
              </div>
              <Progress value={percent} />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
