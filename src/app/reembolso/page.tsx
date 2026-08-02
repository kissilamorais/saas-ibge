import { LegalSection, LegalShell } from '@/components/legal/LegalShell'

export const metadata = {
  title: 'Política de Reembolso — Aprovus',
  description: 'Política de Reembolso e Garantia da plataforma Aprovus',
  robots: { index: false },
}

export const revalidate = 86400

const VERSAO = '2026-08-01'
const EMAIL_SUPORTE = 'suporteaprovus@gmail.com'

export default function ReembolsoPage() {
  return (
    <LegalShell title="Política de Reembolso" versao={VERSAO}>
      <LegalSection title="1. Garantia de satisfação">
        <p>
          Oferecemos garantia de satisfação de <strong>7 (sete) dias</strong> a
          partir da data de compra. Se por qualquer motivo você não estiver
          satisfeito com o Aprovus, devolvemos 100% do valor pago, sem
          questionamentos.
        </p>
      </LegalSection>

      <LegalSection title="2. Como solicitar">
        <ol className="list-inside list-decimal space-y-2">
          <li>
            Envie um e-mail para{' '}
            <a
              href={`mailto:${EMAIL_SUPORTE}`}
              className="text-primary underline"
            >
              {EMAIL_SUPORTE}
            </a>{' '}
            com o assunto <strong>&ldquo;Reembolso&rdquo;</strong>
          </li>
          <li>Informe o e-mail utilizado na compra</li>
          <li>
            A solicitação deve ser feita dentro do prazo de 7 dias a partir da
            compra
          </li>
          <li>Você receberá confirmação em até 2 dias úteis</li>
        </ol>
      </LegalSection>

      <LegalSection title="3. Prazo de processamento">
        <p>
          O reembolso é feito pelo mesmo método de pagamento utilizado na
          compra:
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1">
          <li>Pix: até 1 dia útil</li>
          <li>
            Cartão de crédito: até 2 faturas, conforme política da operadora do
            cartão
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Direito legal de arrependimento">
        <p>
          O art. 49 do Código de Defesa do Consumidor garante o direito de
          arrependimento para compras online: você pode cancelar em até{' '}
          <strong>7 (sete) dias corridos</strong> da contratação e receber a
          devolução integral, sem nenhum custo.
        </p>
      </LegalSection>

      <LegalSection title="5. Quando o reembolso não se aplica">
        <ul className="list-inside list-disc space-y-1">
          <li>Solicitação feita após o prazo de 7 dias</li>
          <li>
            Evidência de uso indevido ou violação dos Termos de Uso (como
            compartilhamento de acesso)
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Contato">
        <p>
          <a
            href={`mailto:${EMAIL_SUPORTE}`}
            className="text-primary underline"
          >
            {EMAIL_SUPORTE}
          </a>
        </p>
      </LegalSection>
    </LegalShell>
  )
}
