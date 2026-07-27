import Link from 'next/link'

/**
 * Saída secundária do CTA: quem não está pronto para comprar vai para o
 * diagnóstico gratuito em vez de fechar a aba.
 *
 * `tone` escolhe o dourado certo para o fundo. Sobre fundo claro usamos o
 * bronze #9A6E12 — o dourado #D4A017 não tem contraste suficiente sobre o
 * verde claro das seções Hero/Oferta (ver a nota de paleta em brand.ts).
 */
export function TrialLink({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const claro = tone === 'light'

  return (
    <div className="mt-4 text-center">
      <Link
        href="/teste"
        className={`text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-80 ${
          claro ? 'text-[#9A6E12]' : 'text-[#D4A017]'
        }`}
      >
        Não tem certeza? Faça o diagnóstico gratuito →
      </Link>
      <p
        className={`mt-1.5 text-xs ${
          claro ? 'text-[#0B3D2E]/60' : 'text-[#FAFAF7]/60'
        }`}
      >
        Descubra exatamente o que precisa estudar. Sem cartão.
      </p>
    </div>
  )
}
