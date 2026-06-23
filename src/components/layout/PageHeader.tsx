import type { ReactNode } from 'react'

interface PageHeaderProps {
  /** Rótulo curto em caixa-alta, dá contexto e ritmo (ex: "Seu edital"). */
  eyebrow?: string
  title: string
  description?: ReactNode
  /** Conteúdo à direita (ex: resumo de progresso). */
  aside?: ReactNode
}

/**
 * Cabeçalho padrão das telas de estudo — mesma voz da dashboard: eyebrow +
 * título em Sora + descrição calma, com um espaço opcional à direita para um
 * resumo. Mantém a tipografia consistente (nada de font-bold solto).
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  aside,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-pretty text-muted-foreground">{description}</p>
        )}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  )
}
