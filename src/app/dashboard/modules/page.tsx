import {
  ModuleCard,
  type ModuleCardData,
} from '@/components/modules/ModuleCard'

// TODO: substituir por dados reais do Supabase (modules + progress do usuário)
const mockModules: ModuleCardData[] = [
  {
    slug: 'portugues',
    title: 'Português',
    description:
      'Gramática, interpretação de texto, ortografia e redação oficial.',
    icon: 'languages',
    completedLessons: 12,
    totalLessons: 15,
  },
  {
    slug: 'raciocinio-logico',
    title: 'Raciocínio Lógico',
    description:
      'Estruturas lógicas, lógica de argumentação, sequências e probabilidade.',
    icon: 'brain',
    completedLessons: 6,
    totalLessons: 10,
  },
  {
    slug: 'administracao',
    title: 'Administração',
    description:
      'Administração pública, gestão de processos, planejamento e controle.',
    icon: 'briefcase',
    completedLessons: 8,
    totalLessons: 14,
  },
  {
    slug: 'informatica',
    title: 'Informática',
    description:
      'Conceitos de hardware, software, redes, segurança e pacote Office.',
    icon: 'monitor',
    completedLessons: 4,
    totalLessons: 9,
  },
  {
    slug: 'conhecimentos-tecnicos',
    title: 'Conhecimentos Técnicos',
    description:
      'Conteúdo técnico específico do cargo de Analista de Gestão (ACA).',
    icon: 'book-open',
    completedLessons: 3,
    totalLessons: 12,
  },
]

export default function ModulesPage() {
  const modules = mockModules

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
