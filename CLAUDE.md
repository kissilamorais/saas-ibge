# Aprovus — Estudo para o concurso ACA do IBGE

> Marca **Aprovus**, assinada pela **Vellum**. ("ACA IBGE" só aparece como descrição do concurso, não como marca.)

**Status:** MVP integrado — auth, dados, pagamento e gate de acesso funcionando com Supabase/Stripe reais
**Stack:** Next.js 14 (App Router) | TypeScript | Supabase | Stripe | Tailwind + shadcn/ui
**Preço:** R$97 (one-time purchase via Stripe)
**Design:** sistema **"Foco calmo"** aplicado em todo o `src/` — teal sereno, off-white quente, dark mode de 1ª classe; Inter (corpo) + Sora (títulos). Tokens semânticos em `src/styles/globals.css` + `tailwind.config.js`. **Regra de cor:** teal por padrão; terracota só para erro/urgência real; **nunca** cores hard-coded (emerald/red/blue).

> ✅ **Estado atual (jun/2026):** as telas de estudo (dashboard, módulos, lições, simulados) consomem **dados reais do Supabase** — não há mais mocks. Já existem: clients Supabase (browser/server/admin), Supabase Auth (login/signup/recuperação de senha), middleware protegendo `/dashboard` e `/checkout`, gate de assinatura por RLS, checkout Stripe (R$97) com webhook idempotente + fallback na página de sucesso, landing pública de vendas e layout com Sidebar/Footer. Banco já seedado.
>
> **Antes de produção:** rodar `migrations/0004` (dedupe de respostas + idempotência do webhook); configurar envs e webhook de produção na Vercel. Testes automatizados cobrem a correção de simulado e o gate de acesso (`npm test`).

---

## 📋 Visão Geral

Plataforma de estudo online para o concurso de Analista de Gestão (ACA) da IBGE:
- Módulos de estudo estruturados (Português, Raciocínio Lógico, Administração, etc.)
- Banco de questões com explicações + quiz engine reutilizável com rastreamento de desempenho
- Simulados completos (provas) com timer, mapa de questões e correção no servidor
- Dashboard inteligente com métricas de progresso
- Auth (email/senha via Supabase) + Stripe checkout R$97 com gate de acesso por assinatura

---

## 🔧 Convenções (o que NÃO é óbvio no código)

- **Nomes:** `[slug]` = dynamic routes · `_private` = componentes privados (não exportados) · `use*` = hooks custom · `get*`/`fetch*` = funções de dados.
- **Cor:** teal por padrão; terracota **apenas** para erro/urgência real; nunca hard-code de cor (emerald/red/blue) — sempre tokens semânticos.
- **Styling:** Tailwind only (evitar CSS custom); shadcn/ui para componentes complexos; dark mode via Tailwind.
- **`QuestionCard` é fonte única** de renderização de questão — usado por lição, simulado e revisão. Não duplicar.
- Correção de simulado e gabarito são **server-side** (nunca confiar no cliente).

---

## 🔐 Segurança (invariantes)

- **RLS ativado** em todas as tabelas — usuário só vê dados próprios. Não afrouxar.
- **Auth middleware** protege `/dashboard` e `/checkout`.
- **Gate de acesso:** páginas de estudo exigem `subscription_status = 'active'`.
- **Webhook Stripe** (`checkout.session.completed`) seta `profiles.subscription_status = 'active'` + `course_access_until`. Deve ser **idempotente**.
- **Secrets:** nunca commitar `.env.local` (variáveis descritas em `.env.example`).

---

## 🎯 Checklist de Completude

- [x] Dashboard com 8 cards de métrica (dados reais)
- [x] Página de módulos com listagem (dados reais)
- [x] Viewer de lição (dados reais)
- [x] Quiz engine (`components/quiz/`, reutilizável)
- [x] Simulados — player com timer + resultados; correção e gabarito no servidor
- [x] Layout base + Sidebar + Footer (`app/dashboard/layout.tsx`) + Navbar pública
- [x] Auth login/signup/recuperação de senha (Supabase Auth)
- [x] Stripe checkout R$97 + webhook idempotente + fallback na success route
- [x] Supabase real (client/server/admin + queries tipadas) + seed
- [x] Landing pública de vendas (`app/page.tsx`)
- [x] Testes dos fluxos críticos (correção de simulado + gate de acesso)
- [x] Rastreamento de checkout abandonado (recovery da Stripe + `/admin/abandonos`) — requer `migrations/0010` e inscrever `checkout.session.expired` no webhook da Stripe
- [ ] Admin panel (upload/manage)
- [ ] Analytics avançadas
- [ ] Deploy em Vercel (envs + webhook de produção)

---

## 🚀 Roadmap de Pré-venda (1-2 semanas)

Sequência para sair de "UI mockada" e chegar a "produto vendável".

**1. Documentação** ✅ — CLAUDE.md + README refletindo o estado real.

**2. Supabase real + seed** — criar projeto no Supabase e rodar `schema.sql`; clients em `lib/supabase/`; `scripts/seed.ts` parseia os `.md` (`*-MODULO-*`, `*-BANCO-*`, `*-SIMULADO-*`) e popula `modules / lessons / questions / question_options / exams`.

**3. Auth + Stripe** — `auth/login`, `auth/signup`, `auth/callback`; middleware protegendo `/dashboard` e `/checkout`; Checkout Session R$97 one-time + webhook que ativa a assinatura; gate de acesso exigindo `subscription_status = 'active'`.

**4. Deploy Vercel** — `vercel` + variáveis de ambiente; webhook Stripe de produção → `/api/stripe/webhook`; `NEXT_PUBLIC_APP_URL` = domínio de produção.

**5. Beta users** — testar fluxo ponta a ponta (signup → checkout → estudo → simulado → resultado); coletar feedback; smoke test em mobile.

---

## 📚 Conteúdo bruto

Módulos e questões existem em markdown na raiz — `*-MODULO-*.md` (aulas), `*-BANCO-DE-*.md` (questões), `*-SIMULADO-*.md` (simulados), `ACA-*.pdf` (provas oficiais). Já importados para o Supabase via seed.
