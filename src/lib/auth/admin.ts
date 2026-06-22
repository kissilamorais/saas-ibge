/**
 * Allowlist de administradores via variável de ambiente (server-only).
 *
 * `ADMIN_EMAILS` é uma lista de e-mails separada por vírgula. Quem está nela é
 * tratado como admin no servidor (ver requireAdmin/isAdmin em session.ts) e é
 * promovido a `profiles.is_admin = true` no 1º acesso ao /admin. Mantemos a
 * lista FORA do código e sem `NEXT_PUBLIC_` — nunca chega ao cliente.
 */
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}
