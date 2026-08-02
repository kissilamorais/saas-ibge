import { LegalSection, LegalShell } from '@/components/legal/LegalShell'

export const metadata = {
  title: 'Política de Privacidade — Aprovus',
  description: 'Política de Privacidade da plataforma Aprovus',
  robots: { index: false },
}

export const revalidate = 86400

const VERSAO = '2026-08-01'
const EMAIL_DPO = 'suporteaprovus@gmail.com'

export default function PrivacidadePage() {
  return (
    <LegalShell title="Política de Privacidade" versao={VERSAO}>
      <LegalSection title="1. Controlador dos dados">
        <p>
          Vellum, operadora da plataforma Aprovus (portalaprovus.com.br), é a
          controladora dos dados pessoais coletados neste serviço.
        </p>
        <p className="mt-2">
          Encarregado de dados (DPO):{' '}
          <a href={`mailto:${EMAIL_DPO}`} className="text-primary underline">
            {EMAIL_DPO}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="2. Quais dados coletamos e por quê">
        <h3 className="mb-2 mt-4 font-medium text-foreground">
          2.1 Dados fornecidos por você
        </h3>
        <ul className="list-inside list-disc space-y-1">
          <li>Nome completo — identificação e emissão de acesso</li>
          <li>
            E-mail — criar conta, enviar acesso e comunicações sobre o serviço
          </li>
          <li>
            WhatsApp — coletado opcionalmente no diagnóstico gratuito para
            suporte e contato comercial
          </li>
          <li>Senha — armazenada com hash seguro, nunca em texto legível</li>
        </ul>

        <h3 className="mb-2 mt-4 font-medium text-foreground">
          2.2 Dados gerados pelo uso
        </h3>
        <ul className="list-inside list-disc space-y-1">
          <li>
            Progresso de estudo: lições concluídas, respostas a questões,
            desempenho nos simulados
          </li>
          <li>
            Dados de diagnóstico: respostas do teste gratuito e pontuação por
            matéria
          </li>
          <li>Data de compra e status de acesso</li>
        </ul>

        <h3 className="mb-2 mt-4 font-medium text-foreground">
          2.3 Dados de navegação (apenas com seu consentimento)
        </h3>
        <ul className="list-inside list-disc space-y-1">
          <li>Endereço IP — segurança e prevenção de abuso</li>
          <li>
            Cookies de analytics (Google Analytics 4) — entender como a
            plataforma é usada
          </li>
          <li>
            Cookies de marketing (Meta Pixel) — mensurar e otimizar campanhas
            publicitárias
          </li>
          <li>
            Identificadores de campanha (UTM) — entender qual anúncio originou o
            acesso
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Com quem compartilhamos">
        <p>
          Seus dados são compartilhados apenas com os fornecedores necessários
          para operar o serviço:
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1">
          <li>Supabase — banco de dados e autenticação (AWS us-east-1)</li>
          <li>Vercel — hospedagem da plataforma (EUA)</li>
          <li>InfinitePay — processamento de pagamento</li>
          <li>Brevo — envio de e-mails transacionais (Europa)</li>
          <li>
            Meta (Facebook/Instagram) — dados de conversão, apenas com seu
            consentimento para marketing
          </li>
          <li>
            Google — dados de navegação, apenas com seu consentimento para
            analytics
          </li>
        </ul>
        <p className="mt-3 font-medium">
          Não vendemos seus dados pessoais a terceiros.
        </p>
      </LegalSection>

      <LegalSection title="4. Por quanto tempo guardamos">
        <ul className="list-inside list-disc space-y-2">
          <li>Dados de conta ativa: enquanto a conta existir</li>
          <li>Dados de compra (e-mail, valor, data): 5 anos (obrigação fiscal)</li>
          <li>Leads do diagnóstico gratuito que não compraram: 24 meses</li>
          <li>Pedidos pendentes não pagos: 90 dias</li>
          <li>Logs de segurança: 6 meses</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Seus direitos (LGPD, art. 18)">
        <p>Você tem direito a:</p>
        <ul className="mt-3 list-inside list-disc space-y-1">
          <li>Confirmar se tratamos seus dados</li>
          <li>
            Acessar os dados que temos sobre você — disponível em{' '}
            <strong>Configurações &gt; Baixar meus dados</strong>
          </li>
          <li>Corrigir dados incompletos ou desatualizados</li>
          <li>
            Solicitar exclusão da sua conta — disponível em{' '}
            <strong>Configurações &gt; Excluir minha conta</strong>
          </li>
          <li>
            Revogar o consentimento para cookies — pelo banner de cookies a
            qualquer momento
          </li>
        </ul>
        <p className="mt-3">
          Para exercer qualquer direito:{' '}
          <a href={`mailto:${EMAIL_DPO}`} className="text-primary underline">
            {EMAIL_DPO}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="6. Cookies">
        <ul className="list-inside list-disc space-y-3">
          <li>
            <strong>Necessários:</strong> essenciais para autenticação e
            segurança. Não podem ser desativados.
          </li>
          <li>
            <strong>Analytics:</strong> Google Analytics 4. Ativados apenas com
            seu consentimento.
          </li>
          <li>
            <strong>Marketing:</strong> Meta Pixel. Ativados apenas com seu
            consentimento.
          </li>
        </ul>
        <p className="mt-3">
          Você pode alterar suas preferências pelo banner de cookies na parte
          inferior da página.
        </p>
      </LegalSection>

      <LegalSection title="7. Segurança">
        <p>
          Adotamos criptografia em trânsito (HTTPS/TLS), autenticação segura,
          controle de acesso por perfil e armazenamento em provedores
          certificados.
        </p>
      </LegalSection>

      <LegalSection title="8. Alterações">
        <p>
          Alterações relevantes serão comunicadas por e-mail com antecedência de
          15 dias.
        </p>
      </LegalSection>

      <LegalSection title="9. Contato e encarregado de dados">
        <p>
          <a href={`mailto:${EMAIL_DPO}`} className="text-primary underline">
            {EMAIL_DPO}
          </a>
        </p>
      </LegalSection>
    </LegalShell>
  )
}
