import type { LucideIcon } from 'lucide-react'
import { CalendarClock, FileText, Send, Sparkles } from 'lucide-react'

/**
 * Bônus com desbloqueio temporal. Cada bônus abre num momento diferente por
 * usuário, ancorado em DUAS datas:
 *   - `purchase_date` do profile (quando o aluno comprou), e
 *   - a data FIXA da prova (`EXAM_DATE`), igual para todos.
 *
 * IMPORTANTE: a prova é uma constante de negócio, NÃO o `profile.exam_date`
 * (esse é a data que o próprio aluno configura em /dashboard/settings para o
 * countdown do dashboard, e pode divergir). A regra da "revisão final" tem que
 * valer igual para todo mundo, então mora aqui.
 *
 * A fonte da verdade do desbloqueio é o servidor (ver `unlock.ts` +
 * páginas/rotas gated). O front só usa isto para exibir cadeado/contador.
 */

/** Data oficial da prova ACA IBGE (America/Sao_Paulo). Formato YYYY-MM-DD. */
export const EXAM_DATE = '2026-09-27'

/** Dias antes da prova em que a revisão final intensiva abre para todos. */
export const FINAL_REVIEW_DAYS_BEFORE_EXAM = 7

/**
 * Regra de desbloqueio de um bônus:
 *  - `purchase-offset`: abre `days` dias após a data de compra do aluno
 *    (0 = imediato na compra). Se o aluno não comprou, nunca abre.
 *  - `fixed`: abre numa data-calendário fixa (YYYY-MM-DD), igual para todos,
 *    independente de quando comprou.
 */
export type UnlockRule =
  | { type: 'purchase-offset'; days: number }
  | { type: 'fixed'; date: string }

export interface Bonus {
  /** Identificador estável, usado em rotas /dashboard/bonus/[slug]. */
  slug: string
  title: string
  /** Frase curta de valor, aparece no card (bloqueado ou não). */
  description: string
  icon: LucideIcon
  unlock: UnlockRule
  /**
   * Tipo de entrega do conteúdo real:
   *  - `page`: conteúdo renderizado na própria página do bônus.
   *  - `download`: arquivo (ex: PDF do edital) servido via /api/bonus/[slug].
   *  - `external`: link externo (ex: grupo do Telegram) via /api/bonus/[slug].
   * O conteúdo real ainda não existe — é preenchido depois (ver `content`).
   */
  delivery: 'page' | 'download' | 'external'
  /**
   * Placeholder do recurso real. Preenchido quando o conteúdo chegar:
   *  - download → caminho/URL do PDF
   *  - external → URL do convite do Telegram
   *  - page → null (o conteúdo vira JSX na página do bônus)
   * `null` aqui = "conteúdo ainda não disponibilizado".
   */
  resourceUrl: string | null
}

/**
 * Subtrai `days` dias de uma data-calendário YYYY-MM-DD, retornando YYYY-MM-DD.
 * Feito em UTC puro (sem horário) só para aritmética de calendário — não há
 * componente de fuso porque a data é um rótulo de dia, não um instante.
 */
export function subtractCalendarDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() - days)
  return dt.toISOString().slice(0, 10)
}

/** Data em que a revisão final abre para todos (EXAM_DATE − 7d). */
export const FINAL_REVIEW_DATE = subtractCalendarDays(
  EXAM_DATE,
  FINAL_REVIEW_DAYS_BEFORE_EXAM,
)

export const BONUSES: Bonus[] = [
  {
    slug: 'cronograma',
    title: 'Cronograma de estudos',
    description: 'Seu plano semanal até a prova, pronto para seguir.',
    icon: CalendarClock,
    unlock: { type: 'purchase-offset', days: 0 },
    delivery: 'page',
    resourceUrl: null,
  },
  {
    slug: 'edital-esquematizado',
    title: 'Edital esquematizado',
    description: 'O edital destrinchado em tópicos, do jeito que a banca cobra.',
    icon: FileText,
    unlock: { type: 'purchase-offset', days: 7 },
    delivery: 'download',
    resourceUrl: null,
  },
  {
    slug: 'grupo-telegram',
    title: 'Grupo no Telegram',
    description: 'Comunidade de estudo com avisos e tira-dúvidas.',
    icon: Send,
    unlock: { type: 'purchase-offset', days: 7 },
    delivery: 'external',
    resourceUrl: null,
  },
  {
    slug: 'revisao-final',
    title: 'Revisão final intensiva',
    description: 'A reta final concentrada, liberada para todos na semana da prova.',
    icon: Sparkles,
    unlock: { type: 'fixed', date: FINAL_REVIEW_DATE },
    delivery: 'page',
    resourceUrl: null,
  },
]

/** Busca um bônus pelo slug (ou undefined). */
export function getBonus(slug: string): Bonus | undefined {
  return BONUSES.find((b) => b.slug === slug)
}
