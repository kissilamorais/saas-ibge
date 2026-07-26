import { daysUntilExam } from '@/lib/bonuses/unlock'

/**
 * Número de dias que faltam para a prova (EXAM_DATE, fuso de São Paulo).
 *
 * Server component de propósito: o valor sai do relógio do SERVIDOR. Resolvido
 * no cliente, o relógio do device faria o HTML divergir do que veio do servidor
 * na virada do dia — o mesmo motivo pelo qual o preço não é resolvido no render
 * do `CheckoutButton`.
 *
 * Renderiza só o número: a copy ao redor ("Faltam … dias") mora no chamador.
 * A landing revalida a cada 5 min (`revalidate` em `app/page.tsx`), então o
 * número acompanha a virada do dia sem precisar de rebuild.
 */
export function DaysUntilExam() {
  return <>{daysUntilExam()}</>
}
