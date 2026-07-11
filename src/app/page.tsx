import type { Metadata } from 'next'
import {
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileWarning,
  HelpCircle,
  Infinity as InfinityIcon,
  Layers,
  ShieldCheck,
  Target,
  X,
} from 'lucide-react'

import { Navbar } from '@/components/layout/Navbar'
import { CheckoutButton } from '@/components/checkout/CheckoutButton'

export const metadata: Metadata = {
  title: 'Aprovus — Preparatório completo para o concurso do IBGE (R$97)',
  description:
    'Módulos, banco com 1000+ questões comentadas e 8 simulados no estilo da prova. Acesso vitalício por R$97.',
}

const STATS = [
  { value: '40+', label: 'módulos de estudo' },
  { value: '1000+', label: 'questões comentadas' },
  { value: '8', label: 'simulados completos' },
]

const PAINS = [
  {
    icon: Clock,
    title: 'Tempo apertado',
    desc: 'A prova é 27/09. Cada semana estudando o conteúdo errado é uma semana que não volta.',
  },
  {
    icon: FileWarning,
    title: 'Material espalhado',
    desc: 'PDF aqui, vídeo ali, resumo em outro lugar. Você perde mais tempo organizando do que estudando.',
  },
  {
    icon: Layers,
    title: 'Excesso que trava',
    desc: 'Cursos gigantes com 300 horas de aula. Ninguém consegue assistir tudo antes da prova.',
  },
  {
    icon: HelpCircle,
    title: 'A dúvida constante',
    desc: 'Sem foco no que a banca cobra, você estuda no escuro — e descobre na prova o que deveria ter priorizado.',
  },
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

const FOR_YOU = [
  'Vai prestar o concurso do IBGE e quer focar no que cai',
  'Está sem tempo e precisa de material direto, não de 300h de aula',
  'Cansou de juntar PDF solto e quer tudo num lugar só',
  'Prefere pagar uma vez a ficar preso em mensalidade',
]

const NOT_FOR_YOU = [
  'Você busca aulas presenciais ou professor ao vivo tirando dúvida',
  'Prefere um curso com dezenas de horas de videoaula',
  'Ainda não decidiu se vai realmente prestar a prova',
]

const FAQ = [
  {
    q: 'É pagamento único mesmo? Não tem mensalidade?',
    a: 'Sim. Você paga R$97 uma vez e tem acesso vitalício a todo o conteúdo. Sem assinatura, sem renovação, sem surpresa no cartão.',
  },
  {
    q: 'O conteúdo está atualizado para o concurso atual?',
    a: 'Sim. O material é alinhado ao edital vigente do IBGE, com foco nas matérias e no estilo da banca.',
  },
  {
    q: 'E se eu comprar e não gostar?',
    a: 'Você tem 7 dias de garantia. Se não achar que vale a pena, devolvemos 100% do valor, sem perguntas.',
  },
  {
    q: 'Serve para qual cargo do IBGE?',
    a: 'O conteúdo cobre as matérias comuns às funções do concurso (como ACA, ACI e demais cargos), com foco nas disciplinas que mais caem.',
  },
  {
    q: 'Como recebo o acesso depois de pagar?',
    a: 'Assim que o pagamento é confirmado, sua conta é criada automaticamente e você recebe um e-mail para definir sua senha e entrar. Leva menos de um minuto.',
  },
  {
    q: 'Consigo estudar pelo celular?',
    a: 'Sim. A plataforma funciona bem em celular, tablet e computador — estude de onde estiver.',
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
            Concurso IBGE 2026 · Prova em 27 de setembro
          </span>
          <h1 className="text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            A prova do IBGE é dia 27/09. Você tem tempo de estudar tudo — ou só o
            que cai?
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            O Aprovus reúne teoria, mais de mil questões comentadas e simulados
            no estilo da banca num só lugar. Direto ao ponto, sem videoaula
            interminável. Pagamento único, acesso até a prova e depois dela.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <CheckoutButton className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Começar agora por R$97
            </CheckoutButton>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Pagamento único de R$97 · Acesso vitalício · Garantia de 7 dias
          </p>

          {/* Stats */}
          <div className="mt-16 grid w-full max-w-2xl grid-cols-3 gap-6 border-t border-border pt-10">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl font-semibold text-primary sm:text-4xl">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dor — o problema do concurseiro perto da prova */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Faltam poucos meses. E o tempo joga contra você.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Todo concurseiro perto da prova sente o mesmo: material espalhado,
            PDF que nunca acaba, videoaula de 3 horas que rende 20 minutos de
            conteúdo útil. E a pergunta que não cala: “será que estou estudando
            o que realmente cai?”
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PAINS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
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

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            O Aprovus resolve isso. Direto ao ponto.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Sem excesso, sem enrolação. Só o essencial para a prova do IBGE,
            organizado num lugar só.
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
      <section className="mx-auto w-full max-w-6xl px-6 py-10">
        {/* Ancoragem de preço */}
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Compare
          </p>
          <p className="mt-4 text-lg text-muted-foreground">
            Um preparatório completo para o IBGE custa entre R$419 e R$1.500 nas
            grandes plataformas — a maioria em mensalidade que você paga até a
            prova.
          </p>
          <p className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            O Aprovus é R$97. Uma vez. Para sempre.
          </p>
        </div>

        <div className="mx-auto max-w-md rounded-3xl border border-primary/20 bg-gradient-to-b from-secondary to-transparent p-8 text-center shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold-soft px-3 py-1 text-sm font-medium text-gold">
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
            <li className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold-soft p-3 text-sm font-medium">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <span>
                Garantia de 7 dias — se não gostar, devolvemos 100%, sem
                perguntas.
              </span>
            </li>
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <CheckoutButton className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            Liberar meu acesso
          </CheckoutButton>
        </div>
      </section>

      {/* Garantia */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-lg rounded-3xl border border-primary/20 bg-gradient-to-b from-secondary to-transparent p-10 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight">
            Risco zero para você
          </h2>
          <p className="mt-4 text-muted-foreground">
            Compre, acesse tudo e estude por 7 dias. Se você não achar que o
            Aprovus vale cada centavo, é só pedir — devolvemos 100% do valor, sem
            perguntas e sem burocracia. O risco é todo nosso.
          </p>
        </div>
      </section>

      {/* Qualificação — pra quem é / não é */}
      <section className="mx-auto w-full max-w-4xl px-6 py-20">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          O Aprovus é pra você?
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h3 className="font-display text-xl font-semibold">
              É pra você se...
            </h3>
            <ul className="mt-6 space-y-4">
              {FOR_YOU.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h3 className="font-display text-xl font-semibold text-muted-foreground">
              Talvez não seja se...
            </h3>
            <ul className="mt-6 space-y-4">
              {NOT_FOR_YOU.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
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

      {/* CTA final — simetria com o hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(159_50%_92%/0.7),_transparent_60%)]" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center sm:py-28">
          <h2 className="text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            A prova é 27 de setembro. Comece hoje.
          </h2>
          <p className="mt-4 max-w-xl text-pretty text-muted-foreground">
            Quanto antes você focar no que cai, mais tempo tem para revisar.
            Acesso imediato, pagamento único, garantia de 7 dias.
          </p>
          <div className="mt-10">
            <CheckoutButton className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              Liberar meu acesso por R$97
            </CheckoutButton>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Pagamento único de R$97 · Sem mensalidade · Garantia de 7 dias, sem
            perguntas
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Aprovus{' '}
          <span className="text-muted-foreground/70">· por Vellum</span> —
          preparatório para o concurso do IBGE.
        </p>
      </footer>
    </div>
  )
}
