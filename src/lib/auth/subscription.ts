/**
 * Predicado puro do gate de acesso pago (sem I/O, testável). Conteúdo pago
 * exige assinatura 'active' — mantém paridade com a policy de RLS
 * `private.has_active_subscription()`.
 */
export function isSubscriptionActive(
  status: string | null | undefined
): boolean {
  return status === 'active'
}
