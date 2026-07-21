import type { Metadata } from 'next'
import { Check, ShieldCheck, Zap } from 'lucide-react'

import { Navbar } from '@/components/layout/Navbar'
import { CheckoutButton } from '@/components/checkout/CheckoutButton'
import { CountdownTimer } from '@/components/CountdownTimer'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'

export const metadata: Metadata = {
  title: 'Aprovus — Preparatório completo para o concurso do IBGE (R$97)',
  description:
    'Módulos, banco com 1000+ questões comentadas e 8 simulados no estilo da prova. Acesso vitalício por R$97.',
}

/** Momento em que o preço sobe de R$97 para R$147 (America/Sao_Paulo). */
const PRICE_DEADLINE = '2026-07-24T23:59:00-03:00'

/** CTA verde vivo — texto escuro para contraste sobre o #00d668. */
const CTA_CLASS =
  'inline-flex h-14 items-center justify-center rounded-xl bg-[#00d668] px-8 text-base font-bold text-[#0B3D2E] shadow-lg shadow-[#00d668]/20 transition-colors hover:bg-[#00c05d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d668] focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/** Cartões da oferta empilhada (seção 4). */
const OFFER = [
  {
    emoji: '🎯',
    title: 'PLATAFORMA COMPLETA',
    desc: 'Teoria + 1.000 questões + 8 simulados',
    badge: 'ACESSO IMEDIATO',
    immediate: true,
  },
  {
    emoji: '📅',
    title: 'CRONOGRAMA DE ESTUDOS ATÉ 27/09',
    desc: 'O que estudar em cada semana, do dia da compra até a véspera da prova. Sem se perder, sem desperdiçar tempo.',
    badge: 'ACESSO IMEDIATO',
    immediate: true,
  },
  {
    emoji: '🗺️',
    title: 'EDITAL ESQUEMATIZADO',
    desc: 'O mapa visual de tudo que mais cai na prova do IBGE. Estude o que importa, ignore o que não vai aparecer.',
    badge: 'LIBERA NO DIA 7',
    immediate: false,
  },
  {
    emoji: '🔥',
    title: 'REVISÃO FINAL INTENSIVA',
    desc: 'Os tópicos que mais caem, concentrados e revisados na reta final. Para você chegar no dia 27/09 afiado.',
    badge: 'LIBERA 7 DIAS ANTES DA PROVA',
    immediate: false,
  },
]

const FAQ = [
  {
    q: 'Funciona pra qual cargo?',
    a: 'Para todos os cargos do concurso IBGE 2026: ACA, ACI, AOR, ACR e ACS. Você escolhe seu cargo na entrada e a plataforma monta sua trilha.',
  },
  {
    q: 'E se eu não gostar?',
    a: '7 dias de garantia total. Devolvo tudo, sem pergunta nenhuma.',
  },
  {
    q: 'Precisa instalar alguma coisa?',
    a: 'Não. É tudo online, abre no celular ou computador.',
  },
  {
    q: 'Vou ter acesso a tudo de uma vez?',
    a: 'O cronograma e a plataforma completa são imediatos. O edital esquematizado libera no dia 7. A revisão final libera 7 dias antes da prova, quando você mais precisa.',
  },
  {
    q: 'Quanto tempo preciso por dia?',
    a: 'O cronograma foi montado pra quem tem vida. 30 minutos a 1 hora por dia já te coloca na frente de quem não está estudando nada.',
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      {/* ===== SEÇÃO 1 — HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(159_50%_92%/0.7),_transparent_60%)]" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center sm:py-32">
          <h1 className="text-balance font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            A prova do IBGE é dia 27/09.
            <br />
            Você vai chegar lá preparado
            <br />
            <span className="text-muted-foreground">
              — ou vai torcer pra cair só o que você viu?
            </span>
          </h1>

          <div className="mt-10">
            <CheckoutButton className={CTA_CLASS}>
              COMEÇAR AGORA POR R$97
            </CheckoutButton>
          </div>

          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              Preço sobe pra R$147 em:
            </p>
            <CountdownTimer targetDate={PRICE_DEADLINE} />
          </div>

          <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-[#00d668]" />
            Garantia de 7 dias · Acesso vitalício · Pagamento único
          </p>
        </div>
      </section>

      {/* ===== SEÇÃO 2 — DOR ===== */}
      <section className="mx-auto w-full max-w-3xl px-6 py-20">
        <h2 className="text-balance text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Estudar pra concurso sem direção é jogar fora o seu tempo — e a sua
          aprovação.
        </h2>
        <div className="mt-10 space-y-4 text-center text-lg text-muted-foreground">
          <p>Você abre o edital e não sabe por onde começar.</p>
          <p>Perde horas em conteúdo que não cai.</p>
          <p>Faz questão sem entender o padrão da banca.</p>
          <p>Chega na prova achando que estudou — e trava.</p>
        </div>
        <p className="mt-10 text-center text-lg font-medium text-foreground">
          Enquanto isso, o prazo vai correndo.
          <br />
          A prova do IBGE não espera.
        </p>
      </section>

      {/* ===== SEÇÃO 3 — SOLUÇÃO ===== */}
      <section className="mx-auto w-full max-w-3xl px-6 py-20">
        <h2 className="text-balance text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          O Aprovus reúne tudo que você precisa para passar no IBGE — num só
          lugar.
        </h2>
        <div className="mt-10 space-y-4 text-lg text-muted-foreground">
          <p className="flex items-start gap-3">
            <Check className="mt-1 h-5 w-5 shrink-0 text-[#00d668]" />
            Teoria organizada por módulo e por cargo.
          </p>
          <p className="flex items-start gap-3">
            <Check className="mt-1 h-5 w-5 shrink-0 text-[#00d668]" />
            +1.000 questões comentadas no estilo da banca IBFC.
          </p>
          <p className="flex items-start gap-3">
            <Check className="mt-1 h-5 w-5 shrink-0 text-[#00d668]" />
            8 simulados completos pra você treinar como se fosse o dia da prova.
          </p>
        </div>
        <p className="mt-10 text-center text-lg font-medium text-foreground">
          Direto ao ponto. Sem enrolação.
          <br />
          Sem videoaula de 4 horas que não te prepara pra nada.
        </p>
      </section>

      {/* ===== SEÇÃO 4 — OFERTA EMPILHADA ===== */}
      <section className="mx-auto w-full max-w-3xl px-6 py-20">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Tudo que você recebe por R$97:
        </h2>

        <div className="mt-12 space-y-4">
          {OFFER.map(({ emoji, title, desc, badge, immediate }) => (
            <div
              key={title}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-start"
            >
              <span className="text-3xl" aria-hidden>
                {emoji}
              </span>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
              <span
                className={
                  'inline-flex shrink-0 items-center self-start rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ' +
                  (immediate
                    ? 'bg-[#00d668]/15 text-[#0B3D2E] dark:text-[#00d668]'
                    : 'bg-muted text-muted-foreground')
                }
              >
                {badge}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-[#00d668]/30 bg-[#00d668]/5 p-8 text-center">
          <p className="font-display text-xl font-semibold">
            Tudo isso: R$97 · Pagamento único · Acesso vitalício
          </p>
          <p className="mt-4 text-muted-foreground">
            Um cursinho presencial custa R$3.000 por ano.
            <br />
            Aqui você paga uma vez e acessa pra sempre.
          </p>

          <div className="mt-8">
            <CheckoutButton className={CTA_CLASS}>
              QUERO ME PREPARAR POR R$97
            </CheckoutButton>
          </div>

          <div className="mt-8 flex justify-center">
            <CountdownTimer targetDate={PRICE_DEADLINE} />
          </div>
        </div>
      </section>

      {/* ===== SEÇÃO 5 — PROVA SOCIAL (placeholder) ===== */}
      <TestimonialsSection />

      {/* ===== SEÇÃO 6 — GARANTIA ===== */}
      <section className="mx-auto w-full max-w-2xl px-6 py-20">
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-b from-secondary to-transparent p-10 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            🔒 GARANTIA BLINDADA DE 7 DIAS
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Entra, testa tudo — plataforma, questões, simulados, cronograma.
          </p>
          <p className="mt-4 text-lg text-muted-foreground">
            Se em 7 dias você achar que não é pra você, me manda uma mensagem e
            devolvo 100% do valor.
          </p>
          <p className="mt-4 text-lg font-medium text-foreground">
            Sem burocracia. Sem pergunta. Sem enrolação.
            <br />
            O risco é todo meu.
          </p>
        </div>
      </section>

      {/* ===== SEÇÃO 7 — URGÊNCIA ===== */}
      <section className="bg-[#0B3D2E] text-white">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            ⚠️ Essa condição muda em:
          </h2>

          <div className="mt-8">
            <CountdownTimer targetDate={PRICE_DEADLINE} />
          </div>

          <div className="mt-10 space-y-3 text-lg text-white/80">
            <p>
              <span className="font-semibold text-white">Hoje:</span> R$97 +
              cronograma + edital + revisão final.
            </p>
            <p>
              <span className="font-semibold text-white">Depois:</span> R$147 —
              sem os bônus de lançamento.
            </p>
          </div>

          <p className="mt-8 text-lg font-medium text-white">
            A prova é 27/09. Cada dia que passa é um dia a menos de preparação.
          </p>

          <div className="mt-10">
            <CheckoutButton className={CTA_CLASS}>
              COMEÇAR AGORA POR R$97
            </CheckoutButton>
          </div>

          <p className="mt-6 flex items-center gap-2 text-sm text-white/70">
            <Zap className="h-4 w-4 text-[#00d668]" />
            Bônus garantidos pra quem entrar hoje
          </p>
        </div>
      </section>

      {/* ===== SEÇÃO 8 — FAQ ===== */}
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
              <h3 className="font-semibold">❓ {q}</h3>
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
          preparatório para o concurso do IBGE.
        </p>
      </footer>
    </div>
  )
}
