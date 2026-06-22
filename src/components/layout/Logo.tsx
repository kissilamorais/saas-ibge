import { GraduationCap } from 'lucide-react'

import { cn } from '@/lib/utils'

interface LogoProps {
  /** Tamanho do símbolo; o wordmark acompanha. */
  size?: 'sm' | 'md'
  /** Mostra só o símbolo, sem o wordmark "Aprovus". */
  iconOnly?: boolean
  className?: string
}

/**
 * Marca Aprovus (assinada pela Vellum). Fonte única usada na Navbar pública e
 * na Sidebar (desktop + mobile) — trocar aqui reflete em todos os pontos.
 *
 * TODO(logo): substituir o ícone `GraduationCap` pela logo oficial da Vellum
 * (SVG em `public/`). Manter `text-primary` se a arte herdar `currentColor`.
 */
export function Logo({ size = 'md', iconOnly = false, className }: LogoProps) {
  return (
    <span
      className={cn(
        'flex items-center gap-2 font-display font-semibold tracking-tight',
        className
      )}
    >
      <GraduationCap
        className={cn('text-primary', size === 'sm' ? 'h-5 w-5' : 'h-6 w-6')}
        aria-hidden
      />
      {!iconOnly && <span>Aprovus</span>}
    </span>
  )
}
