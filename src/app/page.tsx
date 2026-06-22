import Link from 'next/link'
import type { Metadata } from 'next'
import {
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  FileCheck2,
  Infinity as InfinityIcon,
  Target,
} from 'lucide-react'

import { Navbar } from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'Aprovus — Preparatório completo para o concurso ACA do IBGE (R$97)',
  description:
    'Módulos, banco com 1000+ questões comentadas e 8 simulados no estilo da prova. Acesso vitalício por R$97.',
}

const STATS = [
  { value: '40+', label: 'módulos de estudo' },
  { value: '1000+', label: 'questões comentadas' },
  { value: '8', label: 'simulados completos' },
]

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Conteúdo estruturado',
    desc: 'Módulos e lições organizados por matéria, do básico ao avançado, cobrindo o edital.',
  },
  {
    icon: Target,
    title: 'Questões comentadas',
    desc: 'Mais de mil questões com explicação — pratique e entenda o porquê de cada resposta.',
  },
  {
    icon: FileCheck2,
    title: 'Simulados cronometrados',
    desc: '8 provas no estilo da banca, com timer, correção automática e revisão detalhada.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard de desempenho',
    desc: 'Acompanhe horas estudadas, progresso por matéria e seus pontos fracos.',
  },
]

const BENEFITS = [
  'Acesso vitalício a todos os módulos e lições',
  'Banco com 1000+ questões comentadas',
  '8 simulados completos no estilo da prova',
  'Dashboard de desempenho e revisões',
  'Estude no computador ou no celular',
  'Pagamento único — sem mensalidade',
]

const FAQ = [
  {
    q: 'É pagamento único mesmo?',
    a: 'Sim. Você paga R$97 uma vez e tem acesso vitalício a todo o conteúdo. Sem assinatura, sem renovação.',
  },
  {
    q: 'Como recebo o acesso?',
    a: 'Logo após a confirmação do pagamento o acesso é liberado automaticamente na sua conta.',
  },
  {
    q: 'Posso estudar pelo celular?',
    a: 'Sim, a plataforma é responsiva e funciona bem em celular, tablet e computador.',
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero — sala de estudos bem iluminada: clarão teal suave no topo */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(159_50%_92%/0.7),_transparent_60%)]" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center sm:py-32">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Preparatório para Analista — Concurso ACA IBGE
          </span>
          <h1 className="text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            Passe no concurso da IBGE com um plano de estudo que cabe no seu dia.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            Conteúdo completo, mais de mil questões comentadas e simulados no
            estilo da prova — tudo em um só lugar, por um pagamento único.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/auth/signup"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Começar agora por R$97
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-8 text-base font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Já tenho conta
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-6 border-t border-border pt-10">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Tudo que você precisa para a aprovação
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pare de juntar PDFs soltos e videoaulas dispersas. Estude com método.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex rounded-xl bg-secondary p-3 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-md rounded-3xl border border-primary/20 bg-gradient-to-b from-secondary to-transparent p-8 text-center shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
            <InfinityIcon className="h-4 w-4" />
            Acesso vitalício
          </div>
          <div className="mt-6 flex items-end justify-center gap-1">
            <span className="text-2xl font-medium text-muted-foreground">
              R$
            </span>
            <span className="font-display text-6xl font-semibold tracking-tight">
              97
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Pagamento único — sem mensalidade
          </p>

          <ul className="mt-8 space-y-3 text-left">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/auth/signup"
            className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Liberar meu acesso
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-3xl px-6 py-20">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight">
          Perguntas frequentes
        </h2>
        <div className="mt-10 space-y-4">
          {FAQ.map(({ q, a }) => (
            <div
              key={q}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <h3 className="font-semibold">{q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Aprovus{' '}
          <span className="text-muted-foreground/70">· por Vellum</span> —
          preparatório para o concurso ACA do IBGE.
        </p>
        <div className="mt-3 flex justify-center gap-4">
          <Link href="/auth/login" className="hover:text-foreground">
            Entrar
          </Link>
          <Link href="/auth/signup" className="hover:text-foreground">
            Criar conta
          </Link>
        </div>
      </footer>
    </div>
  )
}
