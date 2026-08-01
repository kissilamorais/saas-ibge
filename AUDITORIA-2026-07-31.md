# Auditoria Jurídica, de Segurança e Compliance — Aprovus (Vellum)

**Data:** 31/07/2026 · **Escopo:** repositório completo (`src/`, `migrations/`, `schema.sql`, `scripts/`, configs, dependências, documentos legais) · **Commit base:** `5942872` (branch `main`)
**Método:** leitura integral do código-fonte, migrations e configurações; `npm audit`; `npm test`; inspeção de policies de RLS, rotas, server actions, integrações e fluxos de pagamento.
**Limitação declarada:** não houve acesso ao painel do Supabase de produção, às variáveis de ambiente da Vercel nem às configurações do GitHub. Os achados marcados com **[VERIFICAR EM PRODUÇÃO]** são deduzidos do código versionado — que é a fonte de verdade do schema — e trazem a query/comando de verificação.

---

## Sumário executivo

O código é, em qualidade e disciplina de segurança da aplicação, **acima da média para um MVP**: correção de simulado e diagnóstico são server-side, gabarito não vai ao cliente no simulado, webhooks são idempotentes, o InfinitePay é reconfirmado por `payment_check`, há sessão de convidado assinada (HS256) em vez de conta fantasma no Auth, service_role nunca cruza para o cliente, `react-markdown` sem `rehype-raw` (sem XSS por conteúdo), headers de segurança configurados, 38 testes passando.

Isso torna ainda mais grave o que foi encontrado: **uma falha de uma linha de SQL que anula todo o gate de pagamento**, e **a ausência completa da camada jurídica** (nenhum Termo de Uso, nenhuma Política de Privacidade, nenhum registro de aceite) num produto que já vende, já roda Meta Pixel/GA4 e já coleta nome, e-mail, WhatsApp e IP de leads.

**Veredito:** o sistema **NÃO está apto para operar comercialmente** no estado atual. Não pela arquitetura — que aguenta —, mas por (a) 1 vulnerabilidade crítica de perda direta de receita, (b) 1 alta de fraude de pagamento e (c) exposição jurídica material perante o CDC, a LGPD e a ANPD. As três primeiras correções somam **menos de um dia de trabalho técnico**; a camada jurídica leva de 3 a 5 dias.

---

## Notas gerais

| Dimensão | Nota (0–100) | Comentário |
|---|---|---|
| **Segurança** | **58** | Aplicação bem construída, mas uma falha crítica de controle de acesso no banco derruba a nota. Sem ela, seria ~82. |
| **Jurídico** | **20** | Não existe nenhum documento contratual. Vende-se um produto digital sem termo, sem política de reembolso escrita e sem registro de aceite. |
| **LGPD** | **25** | Trata dados pessoais e sensíveis de marketing sem base legal declarada, sem consentimento de cookies, sem DPO, sem retenção, sem canal de titular. |
| **Arquitetura** | **82** | Separação limpa, RLS como fonte única do gate, onboarding de pagamento compartilhado entre provedores, código morto controlado. |
| **Qualidade de código** | **88** | Comentários explicam o *porquê*, validação com Zod, tipos rigorosos, nomes consistentes, testes nos pontos certos. Destaque real. |
| **Infraestrutura** | **60** | Vercel + Supabase bem usados, mas sem CI/CD, sem scanner, sem CSP, sem rate limit distribuído confirmado, sem backup documentado. |
| **Conformidade geral** | **32** | Puxada para baixo por jurídico e LGPD. |

---

# PARTE I — ACHADOS

## 🔴 CRÍTICO

---

### VUL-A01 — Qualquer usuário cadastrado pode liberar o acesso vitalício de graça (escalada de privilégio via UPDATE em `profiles`)

> **STATUS (01/08/2026): CORRIGIDA — migration aplicada em produção.**
> `migrations/0015_lock_profile_billing_columns.sql` rodada no SQL Editor do Supabase: `revoke update` de `subscription_status`, `purchase_date`, `course_access_until`, `stripe_customer_id`, `email` e `is_trial` para `anon`/`authenticated`, mais o trigger `profiles_protect_billing` como defesa em profundidade.
> **Pendente:** rodar as duas queries do rodapé do arquivo — a de verificação dos privilégios e a de **auditoria retroativa** (acessos `active` sem pedido pago e sem cortesia). A segunda é a única forma de saber se a falha chegou a ser explorada; ela produz falsos positivos esperados (conta demo, ativações manuais, compras via Stripe, que não deixam linha em `pending_orders`).

| Campo | Conteúdo |
|---|---|
| **Severidade** | **CRÍTICA** |
| **Categoria** | Broken Access Control (OWASP A01:2021) · Business Logic · Risco financeiro direto |
| **Arquivos** | `migrations/0001_rls_indexes_exams.sql:84-87` · `migrations/0008_admin_and_complimentary.sql:80-88` · `migrations/0012_free_trial.sql:51` · `schema.sql:11,211-214` |
| **Prioridade** | **P0 — impede o lançamento/continuidade da operação** |
| **Tempo estimado** | 15 minutos (SQL) + 30 minutos de verificação |

**Descrição**

A policy de RLS que permite ao usuário editar o próprio perfil é irrestrita quanto às colunas:

```sql
-- migrations/0001_rls_indexes_exams.sql:84
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
```

A própria migration 0008 reconhece o problema e o corrige **parcialmente**, com um comentário que descreve exatamente o risco:

```sql
-- migrations/0008_admin_and_complimentary.sql:73-88
-- 2b. Blindagem contra escalada de privilégio.
--     A policy "Users can update their own profile" deixa o usuário atualizar
--     QUALQUER coluna da própria linha. Sem isto, ele poderia setar o próprio
--     is_admin=true (...)
revoke update (
  is_admin, lead_followup_status, lead_followup_note, lead_followup_at,
  utm_source, utm_medium, utm_campaign
) on public.profiles from anon, authenticated;
```

A 0012 acrescenta `revoke update (trial_status)`. **Nenhuma migration revoga as colunas que controlam o acesso pago.** Grep completo confirmado — só existem esses dois `revoke update` no repositório inteiro.

Ficam graváveis pelo próprio usuário, via a chave `anon` que está no bundle do navegador:

- `subscription_status` — **é literalmente o gate de tudo**
- `purchase_date` — controla o desbloqueio temporal dos bônus (`src/lib/bonuses/unlock.ts`)
- `course_access_until`
- `stripe_customer_id`
- `email` — **usado como chave de identidade em três fluxos críticos** (ver VUL-A01-b)

O gate de conteúdo (`private.has_content_access()`, `migrations/0008:127-148`) resolve para:

```sql
exists (select 1 from public.profiles p
        where p.id = (select auth.uid()) and p.subscription_status = 'active')
```

E `subscription_status` aceita `'active'` pelo próprio CHECK constraint (`schema.sql:11`). Ou seja: o usuário escreve na coluna que o gate lê.

**Impacto técnico** — Bypass total do controle de acesso. Todo o conteúdo pago (lições, 1.096 questões, 8 simulados, bônus, PDF do Resumo Estratégico servido por `/api/bonus/[slug]`) fica acessível. O `hasContentAccess()` do servidor (`src/lib/auth/session.ts:60`) chama a mesma função SQL, então **o gate da aplicação também cai** — não é só o RLS.

**Impacto financeiro** — Perda de 100% da receita para qualquer comprador tecnicamente competente. A R$67–97 por acesso, o prejuízo escala com a divulgação do método (um post em fórum de concurseiros basta). Além disso, quem já pagou e descobre pode pedir reembolso/chargeback alegando que o produto "é aberto".

**Impacto jurídico** — Falha de segurança em produto pago pode configurar vício do serviço (CDC, art. 20). Se combinada com o vazamento de dados de outros titulares (ver VUL-A01-b), configura incidente de segurança comunicável à ANPD (LGPD, art. 48).

**Exploração (passo a passo reproduzível)**

1. Criar conta gratuita em `/auth/signup` e confirmar o e-mail (fluxo normal, sem pagar).
2. Abrir o DevTools em qualquer página logada. A `NEXT_PUBLIC_SUPABASE_URL` e a `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão no bundle (por design do Supabase).
3. Executar:

```js
// Console do navegador, já logado
const { data: { session } } = await window.__supabase?.auth?.getSession?.() ?? {}
// ou simplesmente pegar o access_token do cookie sb-<ref>-auth-token
await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}`, {
  method: 'PATCH',
  headers: {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  },
  body: JSON.stringify({
    subscription_status: 'active',
    purchase_date: '2026-01-01T00:00:00Z',
  }),
})
```

4. Recarregar `/dashboard` → acesso vitalício completo, inclusive bônus com offset de dias.

**Probabilidade de ocorrência** — **Alta.** Não exige ferramenta especial, apenas o console do navegador. O público-alvo (concurseiros de TI/Informática, incluindo candidatos de ACI) tem exatamente esse perfil técnico.

**Correção**

```sql
-- migrations/0015_lock_profile_billing_columns.sql
begin;

-- Fecha o buraco deixado pela 0008: as colunas que definem o ACESSO PAGO
-- também precisam sair do alcance do próprio usuário. Só o servidor
-- (service_role, após confirmar o pagamento) as escreve.
revoke update (
  subscription_status,
  purchase_date,
  course_access_until,
  stripe_customer_id,
  email,
  is_trial
) on public.profiles from anon, authenticated;

commit;
```

**Verificação obrigatória após aplicar** (rode no SQL Editor do Supabase — deve listar APENAS colunas inócuas como `full_name`, `avatar_url`, `exam_date`, `daily_goal_hours`, `weekly_goal_hours`, `target_function`, `whatsapp`, `trial_cargo`):

```sql
select column_name
from information_schema.column_privileges
where table_schema = 'public'
  and table_name  = 'profiles'
  and grantee in ('anon', 'authenticated')
  and privilege_type = 'UPDATE'
order by column_name;
```

**Defesa em profundidade recomendada** (protege mesmo que um `grant all` futuro reabra a brecha):

```sql
create or replace function public.protect_profile_billing_columns()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- service_role e postgres podem tudo; o usuário comum nunca altera cobrança.
  if current_setting('request.jwt.claim.role', true) in ('service_role') then
    return new;
  end if;
  new.subscription_status  := old.subscription_status;
  new.purchase_date        := old.purchase_date;
  new.course_access_until  := old.course_access_until;
  new.stripe_customer_id   := old.stripe_customer_id;
  new.email                := old.email;
  new.is_admin             := old.is_admin;
  return new;
end $$;

drop trigger if exists profiles_protect_billing on public.profiles;
create trigger profiles_protect_billing
  before update on public.profiles
  for each row execute function public.protect_profile_billing_columns();
```

**Auditoria retroativa** — antes de tudo, verifique se alguém já explorou:

```sql
select id, email, subscription_status, purchase_date, created_at
from public.profiles p
where p.subscription_status = 'active'
  and not exists (
    select 1 from public.pending_orders o
    where lower(o.customer_email) = lower(p.email) and o.status = 'paid'
  )
  and not exists (
    select 1 from public.complimentary_access c
    where lower(c.email) = lower(p.email) and c.revoked_at is null
  )
order by created_at desc;
```

Toda linha retornada é um acesso ativo **sem pagamento e sem cortesia registrada** — ou fruto da exploração, ou de ativação manual não rastreada.

---

### VUL-A01-b — Sequestro de conta e de compra alheia pela mesma brecha (coluna `email`)

| Campo | Conteúdo |
|---|---|
| **Severidade** | **CRÍTICA** (mesma raiz da A01, vetor distinto) |
| **Categoria** | Broken Object Level Authorization · Account Takeover |
| **Arquivos** | `src/lib/onboarding/guest.ts:35-40` · `migrations/0008:140-147` · `src/app/api/stripe/webhook/route.ts:181-186` |
| **Prioridade** | P0 |
| **Tempo estimado** | Coberto pela correção da A01 |

**Descrição** — `profiles.email` é a chave de casamento em três lugares que decidem dinheiro e acesso:

1. `onboardGuestByEmail` (`src/lib/onboarding/guest.ts:35`) resolve **qual conta receberá o acesso pago** por `profiles.email`;
2. `private.has_content_access()` (`migrations/0008:143`) faz `join complimentary_access c on lower(c.email) = lower(p.email)` — cortesia casa por e-mail do profile;
3. o webhook Stripe usa `profiles.email` para decidir se um abandono é de cliente pagante.

Como `email` não está revogada, o usuário pode reescrevê-la (a constraint `unique` só impede colidir com um e-mail já cadastrado).

**Exploração** — Cenário 1: o atacante descobre um e-mail com cortesia de parceiro ativa (ex.: divulgado numa parceria) e ainda não cadastrado; grava esse endereço no próprio `profiles.email`; o join da cortesia passa a casar e ele ganha acesso grátis legítimo aos olhos do sistema. Cenário 2 (pior): o atacante grava o e-mail de uma vítima que ainda não tem conta; quando a vítima **paga**, `onboardGuestByEmail` encontra o profile do atacante e **ativa o acesso na conta dele**; a vítima paga e não recebe nada.

**Impacto jurídico/financeiro** — Cobrança sem entrega (CDC, art. 35), estorno obrigatório, dano moral em tese, e um incidente de segurança com dados de terceiro.

**Probabilidade** — Média (exige alvo específico), mas o impacto individual é total.

**Correção** — incluída no `revoke` da VUL-A01. Adicionalmente, considere migrar o casamento de identidade para `auth.users.email` (que só o GoTrue altera, com confirmação) em vez de `profiles.email`.

---

## 🟠 ALTO

---

### VUL-A02 — Webhook do InfinitePay não valida o VALOR pago: acesso vitalício por R$ 0,01

> **STATUS (01/08/2026): CORRIGIDA NO CÓDIGO — pendente de deploy.**
> Predicado puro em `src/lib/infinitepay/settlement.ts` (`evaluateSettlement`), aplicado nas **duas** portas: `src/app/api/infinitepay/webhook/route.ts` e o safety-net de `src/app/checkout/obrigado/page.tsx`. Fail-closed em todos os ramos. 10 testes em `settlement.test.ts` fixam a regra, incluindo o ataque de R$0,01 e o caso do link que anuncia o preço cheio e liquida centavos. `npm test` 48/48 · type-check · lint · build ✅

| Campo | Conteúdo |
|---|---|
| **Severidade** | **ALTA** |
| **Categoria** | Business Logic Flaw · Fraude de pagamento (OWASP API6:2023) |
| **Arquivos** | `src/app/api/infinitepay/webhook/route.ts:106-116` · `src/lib/infinitepay/server.ts:9-11,119-126` · `src/app/checkout/obrigado/page.tsx:180-187` |
| **Prioridade** | P0 |
| **Tempo estimado** | 1 hora |

**Descrição** — O webhook faz a coisa certa ao reconfirmar o pagamento na API (`checkInfinitePayPayment`), mas valida **apenas o booleano**:

```ts
// src/app/api/infinitepay/webhook/route.ts:106
const check = await checkInfinitePayPayment({ orderNsu, transactionNsu, slug })
if (check.paid !== true) { /* recusa */ }
// ↓ segue direto para o claim + provisionamento — o VALOR nunca é comparado
```

O tipo `PaymentCheckResult` (`src/lib/infinitepay/server.ts:119-126`) **já expõe** `amount` e `paid_amount`, e `pending_orders.amount` já guarda o valor esperado (é lido na linha 61 do webhook, mas só para reportar o Purchase à Meta). A comparação simplesmente não acontece.

Isso importa porque, conforme documentado no próprio código (`src/lib/infinitepay/server.ts:5-8`), **os endpoints `/links` e `/payment_check` são públicos, amarrados apenas ao `handle` da conta** — não exigem chave secreta. Qualquer pessoa pode criar um link de pagamento para o handle `grupovellum` com o valor que quiser.

**Exploração**

1. Iniciar um checkout legítimo em `/checkout` → o `order_nsu` (UUID) fica visível na URL do link do InfinitePay.
2. Fora do site, chamar `POST https://api.checkout.infinitepay.io/links` com `handle: "grupovellum"`, `items: [{ quantity: 1, price: 1, description: "x" }]` e **o mesmo `order_nsu`**.
3. Pagar R$ 0,01. O InfinitePay devolve `transaction_nsu` e `invoice_slug` válidos.
4. `POST` no `/api/infinitepay/webhook` com `{ order_nsu, transaction_nsu, invoice_slug }` — ou simplesmente abrir `/checkout/obrigado?order_nsu=…&transaction_nsu=…&slug=…`, que roda a mesma rede de segurança (`src/app/checkout/obrigado/page.tsx:180`).
5. `payment_check` responde `paid: true` (o pagamento de R$0,01 existe mesmo) → conta criada e acesso vitalício liberado.

**Impacto financeiro** — Produto de R$67 vendido por R$0,01, com o agravante de que a transação é **real** (não é chargeback, é receita legítima de um centavo) — difícil de contestar depois.

**Impacto jurídico** — Baixo diretamente, mas se o método vazar e for usado em massa, a reconciliação financeira/contábil fica comprometida.

**Probabilidade** — Média-alta. Exige conhecer a API do InfinitePay, mas ela é pública e documentada.

**Correção**

```ts
// src/app/api/infinitepay/webhook/route.ts — substituir o bloco da linha 106
const check = await checkInfinitePayPayment({ orderNsu, transactionNsu, slug })

// O valor REALMENTE pago tem que cobrir o preço gravado quando o pedido nasceu.
// Sem isto, um link forjado no mesmo handle (a API /links é pública) libera o
// acesso por qualquer centavo — ver auditoria VUL-A02.
const paidCents = check.paid_amount ?? check.amount ?? null
const expectedCents = order.amount ?? null

if (
  check.paid !== true ||
  paidCents == null ||
  expectedCents == null ||
  paidCents < expectedCents
) {
  reportError(
    'infinitepay.webhook.payment_not_confirmed',
    new Error('pagamento não confirmado ou valor divergente'),
    { orderNsu, paidCents, expectedCents },
  )
  return NextResponse.json({ received: true, skipped: 'not_paid' })
}
```

Replicar a mesma checagem em `infinitePaySafetyNet` (`src/app/checkout/obrigado/page.tsx:186`), que hoje tem o mesmo `if (check.paid !== true)` isolado. **As duas portas precisam da trava** — corrigir só uma não resolve.

**Reforço adicional** — solicitar ao InfinitePay a ativação de assinatura de webhook (HMAC) se disponível, e considerar um `INFINITEPAY_HANDLE` dedicado por ambiente.

---

### VUL-A03 — Ausência total de documentos contratuais e de registro de aceite

| Campo | Conteúdo |
|---|---|
| **Severidade** | **ALTA** |
| **Categoria** | Jurídico · Consumidor (CDC) · Compliance contratual |
| **Evidência** | Não existe `/termos`, `/privacidade`, `/politica-*` em `src/app/**` (varredura completa da árvore de rotas). `src/components/layout/Footer.tsx:13-29` lista só Dashboard/Módulos/Simulados/Suporte. O rodapé da landing (`src/app/page.tsx:52-67`) traz apenas copyright e e-mail. |
| **Prioridade** | P0 (antes de qualquer nova venda) |
| **Tempo estimado** | 3–5 dias (redação + implementação de aceite) |

**Descrição** — O produto vende acesso digital vitalício por R$67–97, com checkout de convidado, e **não possui**:

| Documento | Status |
|---|---|
| Termos de Uso / Contrato de Licença de Uso de Software | ❌ Inexistente |
| Política de Privacidade | ❌ Inexistente |
| Política de Cookies | ❌ Inexistente |
| Política de Reembolso / Cancelamento | ❌ **Prometida na landing, não publicada** |
| Política de Disponibilidade (SLA) | ❌ Inexistente |
| Política de Backup e Retenção | ❌ Inexistente |
| Política de Exclusão de Dados | ❌ Inexistente |
| Aviso sobre uso de IA | ❌ Inexistente (o conteúdo foi gerado com apoio de IA) |
| Limitação de responsabilidade | ❌ Inexistente |
| Propriedade intelectual | ❌ Inexistente |
| Foro de eleição | ❌ Inexistente |
| Aceite eletrônico + versão aceita + IP + timestamp | ❌ **Nenhum registro** |

**Agravante específico:** a landing promete garantia de 7 dias em pelo menos dois lugares — `src/components/landing/HeroSection.tsx:21` (`'Garantia de 7 dias'`), `src/app/teste/resultado/page.tsx:42` (`'Garantia de 7 dias — reembolso se não gostar'`) e há uma seção inteira (`GuaranteeSection.tsx`) e um item de FAQ (`FaqSection.tsx:12` — *"Não gostei — como peço o reembolso?"*). **Uma promessa comercial exibida sem política escrita vincula o fornecedor nos termos anunciados (CDC, art. 30 e 48), e a interpretação de qualquer ambiguidade será contra quem redigiu (art. 47).**

Além disso, o art. 49 do CDC dá **7 dias de arrependimento incondicional** para compra fora do estabelecimento — independentemente da "garantia" comercial —, e isso precisa estar informado.

**Impacto jurídico** — (a) Multa administrativa por PROCON em caso de reclamação sobre reembolso não honrado; (b) impossibilidade prática de defesa em disputa de chargeback, já que não há termo aceito nem prova de aceite; (c) nenhuma limitação de responsabilidade — em tese, o aluno que não passa no concurso pode alegar frustração de expectativa criada pela publicidade; (d) sem cláusula de PI, a redistribuição do material (1.096 questões, módulos) não tem base contratual clara para ser combatida.

**Impacto financeiro** — Chargebacks indefensáveis (a operadora decide a favor do consumidor sem contrato); custo de PROCON; risco de ação coletiva se o volume crescer.

**Probabilidade** — Alta. Basta um cliente insatisfeito.

**Correção**

1. Criar `src/app/termos/page.tsx`, `src/app/privacidade/page.tsx` e `src/app/cookies/page.tsx` (estáticos, `revalidate` alto), com versionamento explícito (`VERSAO_TERMOS = '2026-08-01'`).
2. Linkar no `Footer.tsx`, no rodapé da landing e **acima do botão de compra** (`CheckoutButton`).
3. Implementar aceite registrado. Migration sugerida:

```sql
-- migrations/0016_legal_acceptance.sql
create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  -- Aceite pode ocorrer ANTES de existir conta (checkout guest) → e-mail é o elo.
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  document text not null check (document in ('terms','privacy','refund')),
  version text not null,
  ip inet,
  user_agent text,
  accepted_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_legal_acceptances_email on public.legal_acceptances (lower(email));
alter table public.legal_acceptances enable row level security;
-- Só service_role escreve/lê (mesmo padrão de trial_leads / pending_orders).
```

Gravar no `POST /api/infinitepay/checkout` (o corpo já passa por lá com o e-mail) e no signup, capturando `clientIp(request)` — a função já existe em `src/lib/rate-limit.ts:138`.

4. Redigir com advogado especialista em direito digital/consumidor. O conteúdo é específico: produto educacional, compra única vitalícia, promessa de garantia de 7 dias, público de concurseiro.

---

### VUL-A04 — LGPD: tratamento de dados pessoais sem base legal, sem consentimento de cookies e sem canal do titular

| Campo | Conteúdo |
|---|---|
| **Severidade** | **ALTA** |
| **Categoria** | LGPD (Lei 13.709/2018) |
| **Arquivos** | `src/app/layout.tsx:70-71` · `src/components/analytics/MetaPixel.tsx:34-55` · `src/components/GoogleAnalytics.tsx:25-35` · `src/lib/analytics/meta-capi.ts:29-34,78-85` · `src/app/api/trial/signup/route.ts:97-101` · `migrations/0013_trial_leads.sql:27-45` |
| **Prioridade** | P0/P1 |
| **Tempo estimado** | 3 dias (banner + política + fluxos de titular) |

**Descrição — inventário do que é tratado hoje**

| Dado | Onde | Base legal declarada |
|---|---|---|
| Nome completo | `trial_leads.full_name`, `profiles.full_name` | ❌ nenhuma |
| E-mail | `trial_leads`, `profiles`, `pending_orders`, `abandoned_checkouts` | ❌ nenhuma |
| WhatsApp | `trial_leads.whatsapp`, `profiles.whatsapp` | ❌ nenhuma |
| IP | `clientIp()` no rate limit; enviado à Meta CAPI (`meta-capi.ts:82`) | ❌ nenhuma |
| User-Agent | Meta CAPI (`obrigado/page.tsx:84`) | ❌ nenhuma |
| Cookies `_fbp`/`_fbc` | Lidos e enviados à Meta (`webhook:149-150`) | ❌ nenhuma |
| E-mail hasheado (SHA-256) | Enviado à Meta CAPI (`meta-capi.ts:29-34`) | ❌ nenhuma |
| Desempenho no diagnóstico | `free_trial_results.answers` (perfil de conhecimento) | ❌ nenhuma |
| UTM de origem | `profiles.utm_*` + `localStorage` (`AuthForm.tsx:59`) | ❌ nenhuma |

**Problemas concretos**

1. **Cookies de marketing sem consentimento prévio.** `MetaPixel` e `GoogleAnalytics` são montados no `RootLayout` (`src/app/layout.tsx:70-71`) e disparam no `afterInteractive` **em toda visita, sem qualquer opt-in**. Não há banner de cookies em lugar nenhum do código. Para finalidade de publicidade/remarketing a ANPD orienta consentimento (LGPD, art. 7º, I) — legítimo interesse não é confortável aqui.

2. **Compartilhamento internacional com a Meta.** `sendMetaPurchaseEvent` envia e-mail hasheado + IP + UA + `_fbp`/`_fbc` para `graph.facebook.com` (`meta-capi.ts:115`). É transferência internacional (art. 33) e compartilhamento com terceiro (art. 7º, §5º), sem informar o titular nem registrar base legal.

3. **Sem encarregado (DPO) nomeado nem canal publicado** (art. 41). Existe `suporteaprovus@gmail.com` no rodapé, mas não designado como canal do titular.

4. **Sem atendimento aos direitos do titular (art. 18).** Varredura no repositório: nenhuma rota, tela ou função de exclusão de conta, exportação de dados, correção ou revogação de consentimento. Um pedido de exclusão hoje só pode ser atendido manualmente no painel do Supabase — sem processo, sem prazo, sem registro.

5. **Sem política de retenção.** `trial_leads`, `pending_orders`, `abandoned_checkouts`, `free_trial_results` crescem indefinidamente (ver VUL-A11).

6. **IP enviado ao Discord.** `reportError('rate-limit.redis_degraded', err, { name, id })` (`src/lib/rate-limit.ts:127`) passa o **IP do usuário** como `id`, e `notifyDiscord` (`src/lib/observability/log.ts:58-80`) serializa o contexto inteiro para um webhook do Discord. Isso é compartilhamento de dado pessoal com operador estrangeiro sem contrato nem base legal. O próprio arquivo avisa: *"Nunca logue segredos nem PII desnecessária"* (`log.ts:8`) — e a regra é violada logo abaixo.

**Impacto jurídico** — Sanções da ANPD (art. 52): advertência, multa de até 2% do faturamento limitada a R$50 milhões por infração, publicização da infração, bloqueio ou eliminação dos dados. Para uma operação nova, o risco realista imediato é advertência + obrigação de adequação, mas o passivo cresce com o volume de leads.

**Impacto financeiro** — Além da multa: se a ANPD determinar eliminação dos dados, a base de leads (ativo comercial central do funil `/teste`) é perdida.

**Probabilidade** — Média. Depende de denúncia de titular — e o funil coleta WhatsApp para follow-up comercial, exatamente o tipo de contato que gera denúncia.

**Correção**

1. **Banner de consentimento de cookies** com granularidade (necessários / analytics / marketing), bloqueando `MetaPixel` e `GoogleAnalytics` até o opt-in:

```tsx
// src/app/layout.tsx — passar a montar condicionalmente
<CookieConsentProvider>
  {children}
  <CookieBanner />          {/* grava a escolha em cookie 1st-party */}
  <ConsentGatedAnalytics /> {/* só monta MetaPixel/GA4 se marketing === true */}
</CookieConsentProvider>
```

2. Na `sendMetaPurchaseEvent`, respeitar o consentimento: se `marketing !== true`, enviar sem `client_ip_address`, `client_user_agent`, `fbp`, `fbc` — ou não enviar.
3. Remover PII do contexto enviado ao Discord:

```ts
// src/lib/rate-limit.ts:127 — não vazar o IP para um webhook de terceiro
reportError('rate-limit.redis_degraded', err, { name })
```

4. Publicar Política de Privacidade descrevendo: finalidades, bases legais (execução de contrato para a compra; consentimento para marketing; legítimo interesse para segurança/antifraude), compartilhamentos (Supabase/AWS, Vercel, InfinitePay, Meta, Google, Brevo), transferência internacional, retenção por categoria e direitos do titular.
5. Nomear encarregado e publicar o canal (`privacidade@…`) na política e no rodapé.
6. Implementar `/dashboard/settings` → "Excluir minha conta" e "Baixar meus dados" (server actions com `service_role`, `auth.admin.deleteUser` + purge das tabelas relacionadas).
7. Assinar DPA/contrato de operador com Supabase, Vercel, Meta e Brevo (os três primeiros oferecem DPA padrão).

---

### VUL-A05 — Rate limiting ineficaz em produção (fallback em memória) e ausente nas rotas de autenticação

| Campo | Conteúdo |
|---|---|
| **Severidade** | **ALTA** |
| **Categoria** | OWASP API4:2023 (Unrestricted Resource Consumption) · Brute Force |
| **Arquivos** | `src/lib/rate-limit.ts:22-40,65-98` · `.env.local` (sem `UPSTASH_*`/`KV_*`) · `src/lib/actions/*.ts` (nenhum limite) |
| **Prioridade** | P1 |
| **Tempo estimado** | 2 horas |

**Descrição** — O módulo de rate limit está bem escrito e **avisa explicitamente** quando degrada:

```ts
// src/lib/rate-limit.ts:35
if (RATE_LIMIT_BACKEND === 'memory' && process.env.NODE_ENV === 'production') {
  console.error('[rate-limit] backend em MEMÓRIA em produção — rate limit por IP é ineficaz. …')
}
```

O `.env.local` versionado no ambiente de desenvolvimento **não tem** `UPSTASH_REDIS_REST_URL`/`TOKEN` nem `KV_REST_API_URL`/`TOKEN`. **[VERIFICAR EM PRODUÇÃO]** — confira em Vercel → Settings → Environment Variables; se ausentes, todo o rate limit de produção é por instância serverless e some no cold start, ou seja, praticamente inexistente.

Além disso, **nenhuma** Server Action tem rate limit: `submitExamResult`, `submitPracticeAnswers`, `markLessonComplete` (`src/lib/actions/study.ts`), `updateStudyConfig`, `setTargetFunction` (`profile.ts`) e todas as ações de admin. Um usuário autenticado pode martelar `submitPracticeAnswers` (até 100 respostas por chamada, cada uma virando upsert) sem qualquer teto.

As rotas de auth (`signInWithPassword`, `signUp`, `resetPasswordForEmail`) vão direto ao Supabase pelo cliente — dependem exclusivamente dos limites default do GoTrue, que não estão documentados nem configurados no projeto.

**Impacto técnico** — Brute force de senha viável (senha mínima de 6 caracteres, ver VUL-A16); flood de `pending_orders` e `trial_leads`; esgotamento de conexões do Postgres; custo de compute na Vercel.

**Impacto financeiro** — Custo de infraestrutura por abuso; no limite, indisponibilidade durante uma campanha paga (o pior momento possível).

**Probabilidade** — Média.

**Correção**

1. Provisionar Upstash Redis ou Vercel KV e setar as variáveis em **Production e Preview** (o `.env.example:78-88` já documenta o formato).
2. Aplicar limite nas server actions de escrita:

```ts
// src/lib/actions/study.ts — no topo de cada action de escrita
import { headers } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'

const h = await headers()
const id = user.id // por usuário é melhor que por IP em action autenticada
const rl = await rateLimit('study-write', id, 60, 60)
if (!rl.success) return { ok: false, error: 'rate_limited' }
```

3. No Supabase: Authentication → Rate Limits — reduzir os limites de signup/signin/recover e habilitar proteção contra senha vazada (Auth → Policies → "Prevent use of leaked passwords").

---

### VUL-A06 — Raspagem do banco de questões (principal ativo de PI) pela rota do teste gratuito

| Campo | Conteúdo |
|---|---|
| **Severidade** | **ALTA** |
| **Categoria** | Excessive Data Exposure (OWASP API3:2023) · Propriedade intelectual |
| **Arquivos** | `src/app/api/trial/questions/route.ts:57-150` · `src/app/api/trial/signup/route.ts:27` |
| **Prioridade** | P1 |
| **Tempo estimado** | 3 horas |

**Descrição** — `/api/trial/questions` usa `service_role` (bypass de RLS) para servir 10 questões por chamada, escolhidas **aleatoriamente de todo o pool** (`embaralhar` sobre todos os ids do módulo, linhas 95-107). O gate é uma sessão de convidado que qualquer um obtém em `/api/trial/signup` com nome + e-mail sintéticos. O rate limit é 20 req/min por IP (linha 58) — e, conforme a VUL-A05, provavelmente ineficaz em produção.

**Conta da exploração:** 20 chamadas/min × 10 questões = 200 questões/min. Com sorteio aleatório e coleta por `id`, o "problema do colecionador de cupons" sobre 1.096 questões exige ≈ 1.096 × ln(1.096) ≈ 7.700 amostras, isto é ≈ 770 chamadas ≈ **40 minutos com um único IP**. Com rotação de IP ou o limitador em memória, minutos.

O código comenta o risco (*"sem isso a rota viraria um raspador anônimo do banco de questões (1.096 itens, ~10 por chamada)"*, linhas 17-20) — mas a mitigação escolhida (exigir cookie) não segura quem cria cookies em loop.

**Impacto financeiro** — O banco de questões comentadas é o diferencial do produto (é o que a landing vende: *"1000+ questões comentadas"*). Um concorrente extrai o acervo inteiro por ~R$0 e o revende. Perda de valor do ativo, não recuperável.

**Impacto jurídico** — Positivo apenas no sentido inverso: sem Termos de Uso publicados (VUL-A03), **não há base contratual para agir contra o raspador**. As duas falhas se agravam mutuamente.

**Probabilidade** — Média-alta em mercado de concursos, onde a cópia de acervo é prática comum.

**Correção**

1. **Pool fixo de diagnóstico.** Reservar 30–50 questões marcadas (`questions.is_trial_sample = true`) e sortear as 10 apenas dentro delas. Assim o teto de exposição é o pool, não o acervo:

```sql
alter table public.questions add column if not exists is_trial_sample boolean not null default false;
create index if not exists idx_questions_trial_sample on public.questions (module_id) where is_trial_sample;
```

```ts
// src/app/api/trial/questions/route.ts:95
const { data: ids } = await admin
  .from('questions')
  .select('id')
  .eq('module_id', modulo.id)
  .eq('question_type', 'multiple_choice')
  .eq('is_trial_sample', true)   // ← teto de exposição
```

2. **Um conjunto por lead.** Persistir em `trial_leads` os 10 ids sorteados na primeira chamada e devolver sempre os mesmos — refazer o teste não expõe questões novas.
3. Endurecer o rate limit desta rota especificamente (5/min) e limitar `/api/trial/signup` por e-mail além de por IP.

---

## 🟡 MÉDIO

---

### VUL-A07 — Ausência de Content-Security-Policy

| | |
|---|---|
| **Severidade** | Média · **Arquivo** `next.config.js:29-64` · **Prioridade** P2 · **Tempo** 4 horas |

Os headers implementados são bons (HSTS com preload, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy), e a ausência de CSP está **documentada como decisão consciente** (linhas 29-31). Ainda assim, sem CSP não há contenção para injeção de script de terceiro (o site carrega Meta Pixel, GA4, InfinitePay e Supabase), nem `frame-ancestors` (que é a forma moderna de anti-clickjacking, complementando o X-Frame-Options).

**Correção** — CSP em `Report-Only` primeiro, para levantar a allowlist real sem quebrar nada:

```js
{
  key: 'Content-Security-Policy-Report-Only',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://connect.facebook.net https://www.googletagmanager.com",
    "connect-src 'self' https://*.supabase.co https://graph.facebook.com https://www.google-analytics.com https://api.checkout.infinitepay.io",
    "img-src 'self' data: https://*.supabase.co https://www.facebook.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
}
```

Depois de 1–2 semanas sem violações relevantes, promover para `Content-Security-Policy`. O `'unsafe-inline'` em `script-src` é exigido pelos snippets inline do Pixel/GA4 — para eliminá-lo seria preciso migrar para nonce.

---

### VUL-A08 — Host Header Injection no checkout do InfinitePay

| | |
|---|---|
| **Severidade** | Média · **Arquivo** `src/app/api/infinitepay/checkout/route.ts:68-73` · **Prioridade** P2 · **Tempo** 30 min |

```ts
const forwardedHost = request.headers.get('x-forwarded-host')
const appUrl = forwardedHost && !forwardedHost.includes('localhost')
  ? `${forwardedProto}://${forwardedHost}` : …
// usado em:  redirectUrl: `${appUrl}/checkout/obrigado`
//            webhookUrl:  `${appUrl}/api/infinitepay/webhook`
```

Um header controlado pelo cliente define **para onde o comprador é redirecionado após pagar** e **para onde o InfinitePay envia a notificação de pagamento**. Na Vercel o roteamento por Host limita bastante a exploração prática (hosts desconhecidos não chegam ao projeto), mas a defesa não deve depender disso — e o próprio repositório já tem a solução correta em `src/lib/url/resolve-app-url.ts`, cujo comentário diz: *"nunca deriva de headers controláveis pelo cliente (x-forwarded-host), evitando host header injection"*. A função existe, é usada nos webhooks, e **não é usada aqui**.

**Cenário de dano** — Se explorável, o comprador é redirecionado a um domínio do atacante após pagar (phishing de "confirme seus dados") e o webhook de confirmação nunca chega, deixando o pedido `pending`.

**Correção** — usar a função que já existe, com allowlist como alternativa:

```ts
import { resolveAppUrl } from '@/lib/url/resolve-app-url'
const appUrl = resolveAppUrl()
```

O mesmo padrão está no bloco comentado do Stripe (`src/app/api/stripe/checkout/route.ts:54-59`) — corrigir lá também antes de qualquer reativação.

---

### VUL-A09 — Sem CI/CD, sem scanner de dependências, sem proteção de branch

| | |
|---|---|
| **Severidade** | Média · **Evidência** `.github/` inexistente; `vercel.json` inexistente; 108 commits, todos direto em branches locais · **Prioridade** P2 · **Tempo** 3 horas |

Não há pipeline: `npm test`, `npm run type-check` e `npm run lint` dependem de disciplina manual. Não há Dependabot/Renovate, nem `npm audit` automatizado, nem SAST, nem secret scanning. **[VERIFICAR NO GITHUB]** — proteção da branch `main`, exigência de PR e assinatura de commits (`git log --show-signature` não indica commits assinados).

**Correção** — `.github/workflows/ci.yml` mínimo:

```yaml
name: CI
on: { pull_request: {}, push: { branches: [main] } }
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm test
      - run: npm audit --omit=dev --audit-level=high
```

Mais: habilitar Dependabot (`.github/dependabot.yml`), secret scanning + push protection no GitHub, e exigir PR + status checks para `main`.

---

### VUL-A10 — Painel admin sem MFA e sem trilha de auditoria

| | |
|---|---|
| **Severidade** | Média · **Arquivos** `src/lib/auth/session.ts:75-102` · `src/lib/actions/admin.ts` · `src/lib/actions/testimonials.ts` · **Prioridade** P2 · **Tempo** 1 dia |

O controle de acesso ao painel é **correto**: `requireAdmin()` no layout e em cada página, 404 (não 403) para logado sem privilégio, allowlist via env sem `NEXT_PUBLIC_`, `PATCH /api/admin/trial/[id]/status` revalida `isAdmin()` no servidor. Bem feito.

O que falta:

1. **Sem MFA.** O admin entra com e-mail + senha de 6 caracteres. Comprometida essa senha, o atacante lê a base inteira de leads (nome, e-mail, WhatsApp, desempenho), concede cortesias ilimitadas e altera depoimentos publicados. O Supabase suporta TOTP nativamente.
2. **Sem trilha de auditoria.** `grantComplimentary`, `revokeComplimentary`, `setLeadFollowup`, `createTestimonial`, `deleteTestimonial` e a mudança de status de lead escrevem via `service_role` **sem registrar quem fez o quê e quando** (só `complimentary_access.granted_by` guarda o autor, e apenas na concessão). Em caso de disputa ou incidente, não há como reconstruir os fatos — exigência prática da LGPD (art. 37, registro das operações de tratamento).
3. `syncAllowlistedAdmin` (`session.ts:85-89`) promove `is_admin = true` no primeiro acesso, mas **nada despromove** quem sai do `ADMIN_EMAILS`. Removida a pessoa do env, ela continua admin no banco.

**Correção** — habilitar MFA obrigatório para contas com `is_admin`; criar `admin_audit_log (id, actor_id, action, target_type, target_id, payload jsonb, ip, created_at)` escrita por um helper chamado em toda action administrativa; e no `syncAllowlistedAdmin`, rebaixar quem tem `is_admin = true` e não está mais na allowlist (ou documentar explicitamente que a coluna é a fonte de verdade e o env só promove).

---

### VUL-A11 — Retenção indefinida de dados pessoais

| | |
|---|---|
| **Severidade** | Média · **Arquivos** `migrations/0013_trial_leads.sql` · `0011_add_pending_orders_stripe_events.sql` · `0010_abandoned_checkouts.sql` · `0012_free_trial.sql` · **Prioridade** P2 · **Tempo** 3 horas |

Nenhuma das tabelas de PII tem TTL ou rotina de expurgo:

| Tabela | Conteúdo | Retenção |
|---|---|---|
| `trial_leads` | nome, e-mail, WhatsApp | ♾️ |
| `free_trial_results` | perfil de conhecimento por matéria | ♾️ |
| `pending_orders` | e-mail de comprador (inclusive de pedidos nunca pagos) | ♾️ |
| `abandoned_checkouts` | nome, e-mail, valor, URL de recuperação | ♾️ |
| `stripe_events` | ids de evento | ♾️ (inócuo) |

O princípio da necessidade (LGPD, art. 6º, III) e o término do tratamento (art. 15/16) exigem eliminação quando a finalidade se exaure. Um lead que nunca converteu não justifica retenção perpétua.

**Correção** — política escrita (ex.: leads não convertidos 24 meses; `pending_orders` não pagos 90 dias; `abandoned_checkouts` 12 meses) + rotina agendada (pg_cron no Supabase ou Vercel Cron):

```sql
delete from public.pending_orders
where status = 'pending' and created_at < now() - interval '90 days';

delete from public.trial_leads l
where l.created_at < now() - interval '24 months'
  and not exists (select 1 from public.profiles p
                  where lower(p.email) = lower(l.email) and p.purchase_date is not null);
```

---

### VUL-A12 — Dependências: 1 crítica e 3 altas em dev; libs de produção defasadas

| | |
|---|---|
| **Severidade** | Média · **Arquivo** `package.json` · **Prioridade** P2 · **Tempo** 2 horas |

`npm audit --omit=dev` → **0 vulnerabilidades em produção** (excelente; reflexo da correção anterior do Next 14 → 15.5.22). Porém `npm audit` completo → **7 vulnerabilidades (1 crítica, 3 altas, 3 moderadas)**, via `vitest` → `vite`/`vite-node` e `js-yaml` (GHSA-52cp-r559-cp3m, consumo quadrático de CPU). Não afetam o runtime de produção, mas afetam a máquina de quem roda os testes e um eventual runner de CI.

Defasagens relevantes em produção: `@stripe/stripe-js` 2.4.0 (atual 9.12.1), `@stripe/react-stripe-js` 2.9.0 (atual 6.8.0) — ambos **não utilizados** hoje (o checkout é hospedado, não usa Elements) e portanto candidatos a **remoção**, não a upgrade; `@supabase/supabase-js` 2.108 → 2.111; `jose` 6.2.4 → 6.2.6 (biblioteca que assina o cookie de trial — manter em dia).

**Correção**

```bash
npm audit fix                     # resolve js-yaml e parte do vite
npm i -D vitest@latest            # sai da faixa vulnerável
npm i @supabase/supabase-js@latest jose@latest
npm uninstall @stripe/stripe-js @stripe/react-stripe-js   # não usados
```

Confirmado por grep: nenhum import de `@stripe/react-stripe-js` ou `@stripe/stripe-js` em `src/`. O SDK server-side (`stripe`) continua necessário enquanto o webhook Stripe estiver ativo.

---

### VUL-A13 — Duas superfícies de pagamento ativas simultaneamente

| | |
|---|---|
| **Severidade** | Média · **Arquivos** `src/app/api/stripe/checkout/route.ts:14-19` (410) vs. `src/app/api/stripe/webhook/route.ts` (ativo) · **Prioridade** P3 · **Tempo** 1 hora |

O checkout Stripe foi desativado (responde 410) com o código original preservado em comentário, mas o **webhook Stripe continua ativo e funcional** — inclusive com o caminho de provisionamento de conta (`handleGuestCheckout` → `onboardGuestByEmail`). Duas superfícies de ativação de acesso significam duas superfícies a manter, auditar e testar; e o código comentado (86 linhas) envelhece sem revisão — o `TODO` da linha 23 do webhook, sobre registrar `checkout.session.async_payment_succeeded` no dashboard, é sintoma disso.

**Correção** — decidir: (a) se o Stripe é fallback real, mantê-lo testado e documentado, movendo o bloco comentado para um arquivo `.bak` fora do build; ou (b) se foi abandonado, remover rota, webhook, `lib/stripe/*` e a dependência `stripe`, mantendo `activateUserAccess` (que é agnóstico e usado pelo InfinitePay).

---

### VUL-A14 — Observabilidade insuficiente para um sistema que move dinheiro

| | |
|---|---|
| **Severidade** | Média · **Arquivos** `src/lib/observability/log.ts` · `.env.local` (sem `DISCORD_WEBHOOK_URL`) · **Prioridade** P2 · **Tempo** 3 horas |

O `reportError` é um bom ponto único de captura e o alerta no Discord é a ideia certa. Porém: `DISCORD_WEBHOOK_URL` **não está no `.env.local`** e degrada em silêncio (`log.ts:60`). **[VERIFICAR EM PRODUÇÃO]** Se também estiver ausente na Vercel, eventos que perdem dinheiro — `infinitepay.webhook.paid_missing_email`, `payment_not_confirmed`, `process_failed` — vão só para o console da Vercel, cuja retenção no plano Hobby é de **1 hora**.

Não há Sentry, nem alerta de taxa de erro, nem monitoramento de disponibilidade, nem métrica de conversão técnica (pedidos `pending` que nunca viraram `paid`).

**Correção** — configurar `DISCORD_WEBHOOK_URL` (Production e Preview); plugar Sentry no gancho já existente dentro de `reportError`; criar um alerta simples (Vercel Cron diário) para `select count(*) from pending_orders where status='pending' and created_at < now() - interval '2 hours'` — é o indicador direto de pagamento perdido.

---

### VUL-A15 — Sem backup verificado, sem SLA e sem plano de resposta a incidentes

| | |
|---|---|
| **Severidade** | Média · **Evidência** nenhuma documentação de backup/restauração no repositório · **Prioridade** P2 · **Tempo** 1 dia |

O Supabase faz backup automático conforme o plano (no Free, diário com retenção curta e **sem PITR**). **[VERIFICAR]** o plano contratado. Não há registro de restauração testada, nem RTO/RPO definidos, nem plano de resposta a incidentes — este último é exigência prática da LGPD (art. 48: comunicação à ANPD e ao titular em prazo razoável).

**Correção** — documentar em `docs/OPERACAO.md`: plano do Supabase e janela de PITR, procedimento de restauração (com um teste real registrado), RTO/RPO, e runbook de incidente (quem decide, quem comunica, prazo, modelo de comunicação à ANPD).

---

## 🟢 BAIXO

---

### VUL-A16 — Política de senha fraca e sem verificação de vazamento
`src/components/auth/AuthForm.tsx:174` e `UpdatePasswordForm.tsx:71` — `minLength={6}`, sem exigência de complexidade nem checagem contra bases vazadas. Combinado com a VUL-A05 (rate limit frágil), viabiliza credential stuffing. **Correção:** mínimo 10 caracteres e habilitar "Prevent use of leaked passwords" no Supabase Auth (checagem HIBP nativa). *Tempo: 30 min.*

### VUL-A17 — Documentação desatualizada induz a erro operacional
`README.md` afirma preço **R$97** (o real é R$67 promocional, `src/lib/pricing.ts:24`), **Next.js 14** (é 15.5.22), checkout **Stripe** (é InfinitePay) e manda rodar apenas `migrations/0001..0004` (existem até a **0014**). Seguir o README numa reinstalação de produção produziria um banco sem `pending_orders`, sem `trial_leads`, sem `is_admin` e **sem a blindagem de escalada da 0008** — que é justamente a mitigação parcial da VUL-A01. Documentação errada aqui é risco de segurança, não só de forma. **Correção:** atualizar README (o `CLAUDE.md` está bem mais próximo da realidade). *Tempo: 1 hora.*

### VUL-A18 — `.env.local` com credenciais reais no disco de desenvolvimento
O arquivo **não está versionado** (confirmado: `git ls-files | grep env` → só `.env.example`; `.gitignore:12-17` cobre `.env*.local`) — isso está correto. Mas contém `SUPABASE_SERVICE_ROLE_KEY` (bypass total de RLS) e `TRIAL_SESSION_SECRET` da **mesma instância de produção**. Comprometida a máquina, comprometido o banco inteiro. **Correção:** usar um projeto Supabase separado para desenvolvimento; rotacionar a service_role atual; considerar `vercel env pull` sob demanda em vez de arquivo persistente. *Tempo: 2 horas.*

### VUL-A19 — Interpolação de string em filtro PostgREST
`src/lib/supabase/queries.ts:557` — `query.or(\`function_code.eq.${functionCode},function_code.is.null\`)`. Sem exploração prática: `functionCode` vem de `profile.target_function`, protegido por CHECK constraint (`migrations/0007:23-26`) e por `isFunctionCode()` na escrita. Ainda assim é o único ponto do código onde valor entra em sintaxe de query por concatenação — vale trocar por `.in('function_code', [functionCode])` combinado com `.is()`, ou manter com um comentário explicando a garantia. *Tempo: 15 min.*

### VUL-A20 — Sessão de convidado não é encerrada após a conversão
`src/lib/trial-session.ts` — o cookie `trial_session` (2h) permanece válido após a compra; `clearTrialSession` existe (linha 87) mas **não é chamado em lugar nenhum** (grep confirma zero call sites). Impacto baixo: o cookie carrega só nome/e-mail/cargo digitados pelo próprio visitante, como o comentário do arquivo explica. Ainda assim, higiene de sessão. *Tempo: 15 min.*

### VUL-A21 — Cobertura de testes concentrada em funções puras
38 testes passando em 6 arquivos (`scoring`, `subscription`, `recommendations`, `unlock`, `guest`, `trial-session`) — bem escolhidos, cobrindo inclusive o reclaim da VUL-001. Não há teste de integração dos webhooks de pagamento, nem E2E do fluxo compra → provisionamento → acesso, nem teste algum das policies de RLS. **A VUL-A01 teria sido pega por um único teste de RLS** que tentasse `update profiles set subscription_status='active'` com uma sessão de usuário comum. **Correção:** adicionar suíte de RLS (pgTAP ou script Node com dois clients — anon e service_role) e um E2E de pagamento em sandbox. *Tempo: 2 dias.*

### VUL-A22 — Sem `robots.txt`/`sitemap.ts`; `/teste/*` indexável
`src/app/checkout/obrigado/page.tsx:24` corretamente marca `robots: { index: false }`, mas o funil `/teste/*` não tem diretiva, e não há `robots.ts`/`sitemap.ts` no projeto. Impacto de segurança nulo; impacto de SEO/analytics real. *Tempo: 30 min.*

---

# PARTE II — RESPOSTAS POR ÁREA DO ESCOPO

### 1. Arquitetura
App Router com fronteira servidor/cliente bem respeitada; `service_role` isolado em `lib/supabase/admin.ts` e nunca importado em componente cliente (verificado arquivo a arquivo — os 25 importadores são todos server-side); quatro clients Supabase com propósitos distintos e documentados (`server`/`client`/`admin`/`public`), incluindo a razão do `public.ts` (preservar ISR). Onboarding de pagamento compartilhado entre provedores (`onboardGuestByEmail`) evita divergência de provisionamento. Ponto único de falha: Supabase (banco + auth + storage) — aceitável no estágio. Código morto: bloco de 86 linhas comentado no checkout Stripe e `APP-*.ts` na raiz (excluídos do tsconfig). Duplicação: nenhuma relevante; `QuestionCard` é de fato fonte única, como manda o `CLAUDE.md`.

### 2. Autenticação
Supabase Auth com cookies httpOnly geridos por `@supabase/ssr`; `getUser()` (que valida o JWT no servidor) e não `getSession()`; `cache()` do React deduplicando chamadas; middleware seguindo o padrão oficial sem lógica entre `createServerClient` e `getUser`. Recuperação de senha não revela existência de conta (`ForgotPasswordForm.tsx:61-63`). Logout por POST. Rotação de senha no reclaim de conta não verificada revoga sessões (documentado e testado). **Faltam:** MFA (VUL-A10), política de senha (VUL-A16), limites de brute force próprios (VUL-A05). Session fixation e replay: mitigados pelo GoTrue. Enumeração de usuários: não encontrada.

### 3. Autorização
Modelo de três níveis coerente: `requireUser` → `requireActiveSubscription` → `requireTargetFunction`, mais `requireAdmin`. Verificado que **todas** as 10 páginas de `/admin` e todas as de `/dashboard` chamam o guard adequado. O gate pago tem **fonte única** — `current_user_has_content_access()` RPC compartilha a lógica exata do RLS, em vez de duplicá-la em TypeScript. Excelente decisão. IDOR: testado o acesso a resultado de trial alheio (`/teste/resultado?id=…`) — a query casa `id` **e** `lead_id` do cookie assinado (`resultado/page.tsx:114-115`), portanto negado. Simulado de outra trilha → `notFound()`. **A única falha de autorização é a VUL-A01, e ela é no banco, não na aplicação.**

### 4. APIs
11 rotas auditadas. Todas as de escrita validam entrada; nenhuma aceita `user_id`/`lead_id` do corpo (o dono vem sempre da sessão — explicitamente comentado em `trial/result/route.ts:120-123`). Mass assignment: não encontrado nas rotas; **encontrado no PostgREST direto** (VUL-A01). Sem CORS customizado (bom: same-origin por padrão). Sem versionamento de API — aceitável para app fechado. Endpoints administrativos revalidam `isAdmin()` no servidor e devolvem 404. Injeção: nenhuma (PostgREST parametrizado).

### 5. Banco de dados
RLS habilitado em **todas** as 16 tabelas; tabelas só-servidor (`trial_leads`, `pending_orders`, `stripe_events`) com RLS ligado e **zero policies** — padrão correto. Policies usam `(select auth.uid())` para avaliação única por query. Funções `security definer` com `set search_path = ''`. FKs indexadas. Constraints CHECK em todos os enums de texto. Dedupe e unique para idempotência (`user_answers`, `stripe_events`, `abandoned_checkouts.session_id`, `pending_orders.order_nsu`). **Falha:** privilégios de coluna incompletos (VUL-A01). Criptografia em repouso: pelo Supabase/AWS. Backup: ver VUL-A15.

### 6. Segurança (OWASP Top 10)
| Categoria | Situação |
|---|---|
| A01 Broken Access Control | ❌ **VUL-A01/A01-b (crítica)** |
| A02 Cryptographic Failures | ✅ HS256 com segredo forte, SHA-256 no e-mail à Meta, HTTPS/HSTS |
| A03 Injection | ✅ Nenhuma (PostgREST, sem SQL dinâmico, markdown sem `rehype-raw`) |
| A04 Insecure Design | ⚠️ VUL-A02 (valor não validado), VUL-A06 (raspagem) |
| A05 Security Misconfiguration | ⚠️ Sem CSP (VUL-A07); demais headers OK |
| A06 Vulnerable Components | ⚠️ Produção limpa; dev com 4 altas/crítica (VUL-A12) |
| A07 Auth Failures | ⚠️ Senha fraca, sem MFA, rate limit frágil |
| A08 Integrity Failures | ✅ Webhooks verificados (Stripe por assinatura, InfinitePay por `payment_check`) |
| A09 Logging Failures | ⚠️ VUL-A14; e PII (IP) indo ao Discord (VUL-A04) |
| A10 SSRF | ✅ Nenhum fetch com URL controlada pelo usuário |

Também verificados e **não encontrados**: XSS (todos os tipos), CSRF (Server Actions com proteção nativa do Next 15; rotas JSON exigem preflight), XXE, RCE, LFI/RFI, path traversal, template injection, deserialização insegura, open redirect (`checkout/success` usa `origin` da própria requisição), cache poisoning. Clickjacking: mitigado por `X-Frame-Options: DENY`. Race conditions: tratadas com claim atômico (`.eq('status','pending')`) nos dois webhooks.

### 7. Uploads
**Não aplicável** — não há upload de arquivo pelo usuário em nenhum ponto. Os arquivos de bônus vivem em bucket **privado** do Supabase Storage e saem exclusivamente por `/api/bonus/[slug]`, que revalida pagamento + janela temporal e faz **stream de bytes** (nunca redirect para URL pública), com `Cache-Control: private, no-store`. O `Content-Disposition` usa o nome derivado de `storagePath`, que é constante de código — sem injeção de header. Implementação exemplar.

### 8. Painel administrativo
Ver VUL-A10. Autenticação e autorização corretas; faltam MFA e auditoria.

### 9. Front-end
Nenhum token em `localStorage`/`sessionStorage` (o único uso é UTM e um flag anti-duplicação de pixel). Sessão em cookie httpOnly. Nenhum segredo no bundle além das chaves públicas por design (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, IDs de pixel/GA4). Gabarito não vai ao cliente no simulado (`exams/[examSlug]/page.tsx:27-38`, comentado e implementado). Na prática avulsa e nas lições o gabarito vai ao cliente — decisão consciente e documentada, com correção server-side de qualquer forma.

### 10. Infraestrutura
Vercel + Supabase. TLS/HSTS com preload. Sem Docker/NGINX/WAF próprio. Sem CSP. Secrets em env, corretamente separados cliente/servidor. Falta rate limit distribuído confirmado (VUL-A05) e observabilidade (VUL-A14).

### 11. DevSecOps
Ver VUL-A09. Nada automatizado hoje.

### 12. LGPD
Ver VUL-A04. Não conforme em praticamente todos os itens.

### 13. Jurídico
Ver VUL-A03. Nenhum documento existe.

### 14. Inteligência Artificial
**Não aplicável em runtime** — o produto não chama nenhuma API de LLM; não há prompts, chaves de IA, nem custo variável de inferência. Portanto: sem prompt injection, sem jailbreak, sem vazamento de prompt, sem retenção de dados por provedor de IA. **Ressalva jurídica:** o conteúdo didático foi gerado com apoio de IA (evidente nos `.md` de origem) e o produto é vendido como material preparatório; recomenda-se (a) revisão humana documentada do conteúdo, dado que erro em questão de concurso gera reclamação legítima, e (b) aviso nos Termos sobre a natureza do material e ausência de garantia de aprovação.

### 15. Integrações
| Integração | Verificação | Timeout | Retry | Assinatura |
|---|---|---|---|---|
| InfinitePay `/links` | ✅ server-side | ✅ 8s | ❌ | n/a |
| InfinitePay webhook | ⚠️ `paid` sim, **valor não** (VUL-A02) | ✅ 8s | ✅ (via status) | ❌ (compensado por `payment_check`) |
| Stripe webhook | ✅ `constructEvent` | — | ✅ | ✅ HMAC |
| Meta CAPI | ✅ | ✅ 8s | ❌ | n/a |
| Supabase | ✅ | default | — | JWT |
| Brevo (SMTP) | via Supabase Auth | — | — | — |
| Discord | best-effort | ✅ 5s | ❌ | — |

Nenhuma integração com OpenAI, Mercado Pago, WhatsApp Business API ou Google além do GA4.

### 16. Logs
Log estruturado em JSON com nível e timestamp; `reportError` como ponto único. **Faltam:** correlação por request id, trilha de auditoria administrativa (VUL-A10), registro de tentativas de login (fica só no GoTrue), retenção (VUL-A14). **Excesso:** IP enviado ao Discord (VUL-A04).

### 17. Performance
Índices presentes em todas as FKs e nos filtros usados (inclusive parciais e GIN em `modules.functions`). `(select auth.uid())` nas policies evita reavaliação por linha. `cache()` do React deduplica `getUser`/`getProfile` (o dashboard chegava a 4 chamadas). ISR na landing (`revalidate = 300`) para o preço não congelar. Sem Redis/filas — não necessário na escala atual (a única necessidade real de Redis é o rate limit, VUL-A05). **Ponto de atenção:** `getDashboardData` agrupa dias no fuso do servidor (UTC), o que desloca "Hoje" e o streak para usuários em BRT — bug de produto conhecido, não de segurança. `/api/trial/questions` faz 1 query por módulo (5 queries) + 1 — aceitável.

### 18. Testes
Ver VUL-A21. 38 testes, 6 arquivos, todos passando em 469ms.

### 19. Riscos financeiros
| Risco | Situação |
|---|---|
| Acesso pago gratuito | ❌ **VUL-A01 — trivial** |
| Fraude de valor no pagamento | ❌ **VUL-A02 — R$0,01 por acesso vitalício** |
| Abuso de trial | ⚠️ Ilimitado (sem verificação de e-mail no funil), mas o trial não dá acesso pago — o dano real é a raspagem (VUL-A06) |
| Chargeback | ⚠️ Indefensável sem termos/aceite (VUL-A03) |
| Consumo excessivo de IA | ✅ N/A |
| Exploração de API | ⚠️ VUL-A05 + VUL-A06 |
| Vazamento de créditos | ✅ N/A (compra única) |
| Dupla cobrança | ✅ Guard de `subscription_status === 'active'` no checkout |

---

# PARTE III — LISTAS, CHECKLIST E PLANO

## 1. Vulnerabilidades críticas que impedem a operação comercial

1. **VUL-A01** — Escalada de acesso pago via UPDATE em `profiles` (+ **A01-b**, sequestro de compra pela coluna `email`).
2. **VUL-A02** — Webhook InfinitePay não valida o valor pago.
3. **VUL-A03** — Ausência de Termos de Uso, Política de Privacidade e Política de Reembolso, com garantia de 7 dias anunciada na landing.
4. **VUL-A04** — Pixel e GA4 disparando sem consentimento; sem base legal, DPO, retenção ou canal do titular.

## 2. Melhorias recomendadas antes de escalar investimento em tráfego

5. VUL-A05 — Rate limit distribuído (Upstash/KV) + limites nas Server Actions.
6. VUL-A06 — Pool fixo para o diagnóstico gratuito.
7. VUL-A07 — CSP em Report-Only → enforce.
8. VUL-A08 — `resolveAppUrl()` no checkout InfinitePay.
9. VUL-A09 — CI com type-check, lint, test e audit; proteção da `main`.
10. VUL-A12 — `npm audit fix`, atualizar `vitest`/`supabase-js`/`jose`, remover SDKs Stripe não usados.
11. VUL-A14 — `DISCORD_WEBHOOK_URL` em produção + Sentry.
12. VUL-A17 — README atualizado (a lista de migrations errada é risco operacional real).

## 3. Melhorias desejáveis para versões futuras

13. VUL-A10 — MFA no admin + trilha de auditoria + despromoção automática.
14. VUL-A11 — Política e rotina de retenção.
15. VUL-A13 — Decidir o destino do Stripe (manter testado ou remover).
16. VUL-A15 — Backup testado, RTO/RPO, runbook de incidente.
17. VUL-A16 — Senha mínima de 10 + bloqueio de senha vazada.
18. VUL-A18 — Projeto Supabase separado para desenvolvimento.
19. VUL-A19/A20/A22 — Higiene (filtro PostgREST, limpeza de cookie de trial, robots/sitemap).
20. VUL-A21 — Suíte de testes de RLS + E2E de pagamento.

## 4. Checklist de conformidade

**Legenda:** ✅ Conforme · 🟡 Parcialmente conforme · ❌ Não conforme · ⚪ Não aplicável

### Segurança da aplicação
| Item | Status | Nota |
|---|---|---|
| RLS habilitado em todas as tabelas | ✅ | 16/16 |
| Policies de RLS por operação | ✅ | SELECT/INSERT/UPDATE cobertos |
| **Privilégios de coluna (anti-escalada)** | ❌ | **VUL-A01** |
| Middleware de autenticação | ✅ | `/dashboard`, `/checkout`, `/admin` |
| Gate de assinatura server-side | 🟡 | Correto na aplicação, furado no banco |
| Autorização de admin | ✅ | 404 em vez de 403; revalidado nas rotas |
| Correção server-side (simulado/trial) | ✅ | Gabarito nunca vem do cliente |
| Gabarito oculto no simulado | ✅ | |
| Validação de entrada | ✅ | Zod nas actions; type guards nas rotas |
| Proteção contra XSS | ✅ | Sem `rehype-raw`, sem `dangerouslySetInnerHTML` de usuário |
| Proteção contra CSRF | ✅ | Server Actions + JSON com preflight |
| Proteção contra SQL Injection | ✅ | PostgREST parametrizado |
| Headers de segurança | 🟡 | HSTS/XFO/nosniff/Referrer/Permissions ✅; **CSP ❌** |
| Rate limiting | 🟡 | Implementado; backend distribuído não confirmado |
| Secrets fora do versionamento | ✅ | `.gitignore` correto, histórico limpo |
| Webhooks idempotentes | ✅ | Dedupe por evento + claim atômico |
| **Verificação de valor no pagamento** | ❌ | **VUL-A02** |
| MFA no admin | ❌ | |
| Trilha de auditoria administrativa | ❌ | |
| Upload de arquivos | ⚪ | Não existe |
| Integração com IA | ⚪ | Não existe |

### Jurídico
| Item | Status |
|---|---|
| Termos de Uso | ❌ |
| Política de Privacidade | ❌ |
| Política de Cookies | ❌ |
| Política de Reembolso (anunciada na landing) | ❌ |
| SLA / Disponibilidade | ❌ |
| Política de Backup | ❌ |
| Política de Retenção | ❌ |
| Política de Exclusão de Dados | ❌ |
| Aviso sobre IA no conteúdo | ❌ |
| Limitação de responsabilidade | ❌ |
| Propriedade intelectual | ❌ |
| Foro de eleição | ❌ |
| Aceite eletrônico registrado | ❌ |
| Registro de IP do aceite | ❌ |
| Registro de data/hora do aceite | ❌ |
| Registro da versão aceita | ❌ |

### LGPD
| Item | Status |
|---|---|
| Base legal declarada | ❌ |
| Consentimento para cookies/marketing | ❌ |
| Finalidade informada | ❌ |
| Minimização | 🟡 (WhatsApp já foi removido do formulário — bom sinal) |
| Compartilhamento informado | ❌ |
| Transferência internacional informada | ❌ |
| Retenção definida | ❌ |
| Anonimização | ❌ |
| Exportação de dados (art. 18) | ❌ |
| Exclusão de dados (art. 18) | ❌ |
| Encarregado (DPO) | ❌ |
| Canal do titular | ❌ |
| Registro de operações (art. 37) | ❌ |
| Resposta a incidentes (art. 48) | ❌ |
| PII fora dos logs | 🟡 (IP vai ao Discord) |

### Infraestrutura e DevSecOps
| Item | Status |
|---|---|
| HTTPS/TLS | ✅ |
| HSTS com preload | ✅ |
| Secrets em variáveis de ambiente | ✅ |
| Separação cliente/servidor de env | ✅ |
| CI/CD | ❌ |
| Scanner de dependências automatizado | ❌ |
| Proteção da branch `main` | ❌ **[verificar no GitHub]** |
| Assinatura de commits | ❌ |
| Backup verificado | ❌ |
| Monitoramento/alertas | 🟡 |
| WAF | ❌ (Vercel oferece nativo — avaliar) |

## 5. Plano de ação priorizado

### Bloco 0 — Hoje (≈ 2 horas, elimina o risco financeiro imediato)
| # | Ação | Arquivo | Esforço | Status |
|---|---|---|---|---|
| 1 | `revoke update` das colunas de cobrança + `email` em `profiles` | `migrations/0015_lock_profile_billing_columns.sql` | 15 min | ✅ **aplicada em produção** (01/08) |
| 2 | Rodar a query de auditoria retroativa e revogar acessos ilegítimos | SQL Editor (query no rodapé da 0015) | 30 min | ⏳ **pendente** |
| 3 | Validar valor pago no webhook InfinitePay **e** no safety-net da `/obrigado` | `settlement.ts` + as 2 rotas | 1 h | ✅ **feito** (10 testes) |
| 4 | Trigger de defesa em profundidade em `profiles` | `migrations/0015` | 20 min | ✅ **aplicado em produção** (01/08) |
| 5 | Deploy na Vercel (leva o item 3 ao ar) | — | 10 min | ⏳ **pendente** |

### Bloco 1 — Esta semana (≈ 2 dias técnicos)
| # | Ação | Esforço |
|---|---|---|
| 5 | Provisionar Upstash/KV e setar envs (Prod + Preview) | 1 h |
| 6 | Rate limit nas Server Actions de escrita | 2 h |
| 7 | `resolveAppUrl()` no checkout InfinitePay | 30 min |
| 8 | Pool fixo de questões do diagnóstico (`is_trial_sample`) | 3 h |
| 9 | `DISCORD_WEBHOOK_URL` em produção + remover IP do contexto | 1 h |
| 10 | `npm audit fix` + atualizações + remoção dos SDKs Stripe não usados | 2 h |
| 11 | CI (`type-check`, `lint`, `test`, `audit`) + proteção da `main` | 3 h |
| 12 | Atualizar README (lista de migrations!) | 1 h |

### Bloco 2 — Próximas 2 semanas (jurídico — pode correr em paralelo)
| # | Ação | Esforço |
|---|---|---|
| 13 | Contratar advogado (direito digital + consumidor) | — |
| 14 | Redigir Termos, Privacidade, Cookies, Reembolso, Retenção | 3–5 dias |
| 15 | Publicar as páginas + links (footer, landing, acima do CTA) | 1 dia |
| 16 | Tabela `legal_acceptances` + gravação com IP/UA/versão | 4 h |
| 17 | Banner de consentimento com bloqueio de Pixel/GA4 até opt-in | 1 dia |
| 18 | Nomear encarregado + publicar canal | 2 h |
| 19 | Fluxos de exclusão e exportação de conta | 1 dia |
| 20 | DPAs com Supabase, Vercel, Meta, Brevo | 4 h |

### Bloco 3 — Próximo mês
| # | Ação | Esforço |
|---|---|---|
| 21 | CSP Report-Only → enforce | 4 h + 2 semanas de observação |
| 22 | MFA no admin + `admin_audit_log` | 1 dia |
| 23 | Rotina de retenção (pg_cron) | 3 h |
| 24 | Testes de RLS + E2E de pagamento | 2 dias |
| 25 | Sentry + alerta de `pending_orders` presos | 4 h |
| 26 | Backup testado + runbook de incidente | 1 dia |
| 27 | Decidir destino do Stripe | 1 h |

---

# PARTE IV — CONCLUSÃO

**O sistema não está apto para operar comercialmente hoje.**

Sob a perspectiva de **segurança**, a arquitetura é sólida e a disciplina de código é notável — o gate de acesso tem fonte única compartilhada entre RLS e aplicação, os webhooks são idempotentes e reconfirmados na fonte, o gabarito não vaza, o service_role está contido, e há testes cobrindo justamente as regressões perigosas. Mas **uma única linha de SQL ausente anula todo esse trabalho**: a migration 0008 identificou corretamente que a policy de UPDATE em `profiles` é irrestrita por coluna e revogou sete colunas — deixando de fora exatamente as quatro que controlam o acesso pago e a coluna `email`, que é a chave de identidade do provisionamento. Qualquer usuário cadastrado libera o produto inteiro com uma chamada HTTP. Isso é conserto de 15 minutos, e é a coisa mais importante deste relatório.

Some-se a isso a ausência de validação do valor pago no webhook do InfinitePay: como a API `/links` daquele provedor é pública e amarrada apenas ao handle, o acesso vitalício custa um centavo para quem souber. Também é conserto de uma hora.

Sob a perspectiva de **conformidade e proteção de dados**, a situação é mais séria porque não se resolve com código: o produto vende, coleta nome, e-mail, WhatsApp, IP e perfil de conhecimento de leads, dispara Meta Pixel e GA4 em toda visita, envia dados a servidores no exterior — e **não possui um único documento legal**. Não há Termos, não há Política de Privacidade, não há base legal declarada, não há consentimento de cookies, não há encarregado, não há retenção, não há canal do titular, não há registro de aceite. Ao mesmo tempo, a landing promete garantia de 7 dias em quatro lugares distintos, criando obrigação vinculante sem documento que a delimite. Nessa configuração, uma disputa de chargeback é indefensável e uma denúncia à ANPD encontra o cenário completo de não conformidade.

Sob a perspectiva de **mitigação de riscos jurídicos**, os dois planos se reforçam negativamente: sem Termos de Uso, não há base contratual para agir contra quem raspar o banco de questões pela rota do teste gratuito (VUL-A06) — o ativo mais valioso do produto fica exposto tecnicamente e desprotegido juridicamente ao mesmo tempo.

**O caminho é curto e bem definido.** O Bloco 0 (≈2 horas) elimina o sangramento financeiro. O Bloco 1 (≈2 dias) fecha as portas de abuso. Ambos podem ser feitos esta semana. O Bloco 2 (jurídico, 2 semanas) roda em paralelo e depende mais de contratar um advogado do que de trabalho técnico. **Concluídos os Blocos 0, 1 e 2, o sistema estará apto para produção** com nota de segurança estimada em 85 e conformidade em 75 — patamar adequado para um produto digital desse porte.

Uma observação que merece registro: os comentários do código foram, repetidamente, a melhor fonte desta auditoria. Vários deles descrevem com precisão riscos que o próprio código então mitiga — e um deles (o da migration 0008, sobre escalada de privilégio) descreve com precisão o risco que **não** foi inteiramente mitigado. Isso indica que quem escreveu o sistema entende os problemas certos; faltou fechar a lista.

---

*Auditoria conduzida sobre o commit `5942872` em 31/07/2026. Achados marcados **[VERIFICAR EM PRODUÇÃO]** dependem de acesso aos painéis de Vercel, Supabase e GitHub e devem ser confirmados antes do fechamento do plano de ação.*
