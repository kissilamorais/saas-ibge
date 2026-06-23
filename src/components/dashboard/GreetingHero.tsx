'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'

interface GreetingHeroProps {
  /** Primeiro nome do aluno (ou null → saudação neutra). */
  name: string | null
  /** Foco de hoje: próxima lição. Null quando tudo está em dia. */
  foco: { title: string; moduleTitle: string; href: string } | null
}

function greetingFor(hour: number): string {
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

/**
 * Foco caloroso de boas-vindas: saudação pelo nome conforme a hora + o "foco de
 * hoje" (a próxima lição vira propósito da tela) + um caminho direto pra
 * continuar. A hora/data são resolvidas no cliente (fuso do aluno) para não
 * brigar com o horário do servidor.
 */
export function GreetingHero({ name, foco }: GreetingHeroProps) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])

  const firstName = name?.trim().split(/\s+/)[0] ?? null
  const greeting = now ? greetingFor(now.getHours()) : 'Olá'
  const dateLabel = now
    ? now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : ''

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      {/* Clarão teal suave: a sala de estudos bem iluminada, sem gritar. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,_hsl(var(--primary)/0.12),_transparent_70%)]"
      />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          {dateLabel && (
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {dateLabel}
            </p>
          )}
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting}
            {firstName ? `, ${firstName}` : ''}.
          </h1>
          {foco ? (
            <p className="max-w-xl text-pretty text-muted-foreground">
              <span className="font-medium text-foreground">Foco de hoje:</span>{' '}
              {foco.title}{' '}
              <span className="text-muted-foreground/70">· {foco.moduleTitle}</span>
              {' — '}você está no caminho.
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Sparkles className="h-4 w-4 text-gold" />
              Tudo em dia. Que tal revisar ou encarar um simulado?
            </p>
          )}
        </div>

        {foco && (
          <Link
            href={foco.href}
            className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Continuar de onde parei
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </section>
  )
}
