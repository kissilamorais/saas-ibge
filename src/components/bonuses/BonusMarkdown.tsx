import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

interface BonusMarkdownProps {
  /** Conteúdo em markdown (GitHub Flavored). */
  source: string
  className?: string
}

/**
 * Renderiza o markdown de um bônus de página com a mesma voz tipográfica das
 * lições (prose + dark mode). Server Component — o conteúdo é estático, sem
 * interatividade. Cole o conteúdo em `src/lib/bonuses/content.ts`, não aqui.
 */
export function BonusMarkdown({ source, className }: BonusMarkdownProps) {
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none dark:prose-invert',
        'prose-headings:font-semibold prose-a:text-primary prose-table:text-sm',
        'prose-code:rounded prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-secondary-foreground prose-code:before:content-none prose-code:after:content-none',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
    </div>
  )
}
