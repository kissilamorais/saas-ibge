import { redirect } from 'next/navigation'

// Página inicial: por enquanto redireciona direto para o dashboard.
// TODO: substituir por landing/página de vendas (R$97) quando o checkout existir.
export default function HomePage() {
  redirect('/dashboard')
}
