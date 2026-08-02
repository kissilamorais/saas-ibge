import { LegalSection, LegalShell } from '@/components/legal/LegalShell'

export const metadata = {
  title: 'Termos de Uso — Aprovus',
  description: 'Termos de Uso da plataforma Aprovus',
  robots: { index: false },
}

export const revalidate = 86400

const VERSAO = '2026-08-01'
const EMAIL_SUPORTE = 'suporteaprovus@gmail.com'

export default function TermosPage() {
  return (
    <LegalShell title="Termos de Uso" versao={VERSAO}>
      <LegalSection title="1. Quem somos">
        <p>
          Aprovus é uma plataforma de preparação para o concurso do IBGE (edital
          01/2026, banca IBFC), operada por Vellum. O acesso é feito pelo
          endereço <span className="font-medium">portalaprovus.com.br</span>.
        </p>
      </LegalSection>

      <LegalSection title="2. O que você está contratando">
        <p>Ao adquirir o Aprovus, você obtém acesso individual a:</p>
        <ul className="mt-3 list-inside list-disc space-y-1">
          <li>
            Plataforma de questões comentadas (banco com mais de 1.000 itens)
          </li>
          <li>
            Módulos de estudo por disciplina (Português, Lógica, Administração,
            Informática e áreas técnicas)
          </li>
          <li>Simulados completos no formato da banca IBFC</li>
          <li>Diagnóstico de desempenho por matéria</li>
          <li>Material de revisão final (liberado conforme cronograma)</li>
          <li>Cronograma de estudos personalizado</li>
          <li>Suporte por e-mail</li>
        </ul>
        <p className="mt-3">
          O acesso é pessoal e intransferível. Uma licença equivale a um único
          usuário.
        </p>
      </LegalSection>

      <LegalSection title="3. Preço e pagamento">
        <p>
          O acesso é adquirido por pagamento único no valor exibido no site no
          momento da compra. O pagamento é processado por InfinitePay (Pix,
          cartão de crédito e parcelamento em até 12 vezes).
        </p>
      </LegalSection>

      <LegalSection title="4. Garantia e reembolso">
        <p>
          Você tem 7 (sete) dias a partir da data de compra para solicitar o
          reembolso integral, sem precisar apresentar justificativa. Para
          exercer a garantia, envie um e-mail para{' '}
          <a
            href={`mailto:${EMAIL_SUPORTE}`}
            className="text-primary underline"
          >
            {EMAIL_SUPORTE}
          </a>{' '}
          com o assunto &ldquo;Reembolso&rdquo; e o e-mail utilizado na compra.
        </p>
        <p className="mt-3">
          O reembolso é processado pelo mesmo método de pagamento utilizado, no
          prazo de até 7 dias úteis após a confirmação da solicitação.
        </p>
        <p className="mt-3">
          Além da garantia comercial acima, o art. 49 do Código de Defesa do
          Consumidor garante o direito de arrependimento para compras online:
          você pode cancelar em até 7 (sete) dias corridos da contratação e
          receber a devolução integral dos valores pagos.
        </p>
      </LegalSection>

      <LegalSection title="5. Acesso e conta">
        <p>
          O acesso à plataforma é pessoal. Você é responsável por manter a
          confidencialidade da sua senha. O compartilhamento de credenciais com
          terceiros constitui violação destes Termos e pode resultar no
          cancelamento do acesso.
        </p>
      </LegalSection>

      <LegalSection title="6. Conteúdo e propriedade intelectual">
        <p>
          Todo o conteúdo da plataforma — questões, comentários, textos,
          materiais de estudo, simulados e bônus — é de propriedade de Vellum ou
          licenciado a ela, e está protegido pela Lei de Direitos Autorais (Lei
          9.610/1998).
        </p>
        <p className="mt-3">
          É vedado reproduzir, redistribuir, vender, publicar ou compartilhar o
          conteúdo da plataforma, no todo ou em parte, sem autorização expressa
          e por escrito.
        </p>
      </LegalSection>

      <LegalSection title="7. Disponibilidade do serviço">
        <p>
          A plataforma é fornecida no estado em que se encontra. Empregamos
          esforços razoáveis para manter o serviço disponível, mas não
          garantimos disponibilidade ininterrupta. O serviço pode ser encerrado
          mediante comunicação por e-mail com antecedência mínima de 30 (trinta)
          dias.
        </p>
      </LegalSection>

      <LegalSection title="8. Limitação de responsabilidade">
        <p>
          Aprovus é um material de apoio ao estudo. Não garantimos aprovação no
          concurso. O conteúdo foi elaborado com base no edital 01/2026 do IBGE
          e pode ser complementado em caso de alterações no edital.
        </p>
      </LegalSection>

      <LegalSection title="9. Alterações nos Termos">
        <p>
          Podemos atualizar estes Termos a qualquer momento. Alterações
          relevantes serão comunicadas por e-mail com antecedência mínima de 15
          dias.
        </p>
      </LegalSection>

      <LegalSection title="10. Lei aplicável">
        <p>
          Estes Termos são regidos pelas leis da República Federativa do Brasil.
        </p>
      </LegalSection>

      <LegalSection title="11. Contato">
        <p>
          Dúvidas:{' '}
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
