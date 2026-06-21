# SaaS IBGE - Estudo para Concurso ACA

Plataforma de estudo online para o concurso de Analista de Gestão (ACA) da IBGE.

**Status:** MVP integrado (Supabase + Stripe reais) — faltam apenas envs/webhook de produção  
**Preço:** R$97 (one-time purchase)  
**Stack:** Next.js 14 | TypeScript | Supabase | Stripe | Tailwind CSS + shadcn/ui

> ✅ As telas de estudo consomem **dados reais do Supabase** (sem mocks). Auth (login/signup/recuperação de senha), gate de assinatura por RLS, checkout Stripe R$97 com webhook idempotente, landing pública e layout com Sidebar já estão prontos. Rode `npm test` para os testes dos fluxos críticos. Para ir a produção, veja **Deploy na Vercel** abaixo.

---

## 🚀 Setup Rápido

### 1. Clonar e instalar dependências

```bash
cd saas-ibge
npm install
```

### 2. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie a URL e as chaves em `.env.local`
3. Execute os SQLs no Supabase SQL editor, **nesta ordem**:

```text
1) schema.sql
2) migrations/0001_rls_indexes_exams.sql
3) migrations/0002_questions_source_ref.sql
4) migrations/0003_grant_subscription_fn.sql
5) migrations/0004_consolidate_and_answers_unique.sql
```

> Os arquivos em `supabase/*.sql` são **históricos** (superseded pelas migrations) — não rode.

4. Seed de dados: o banco já foi populado a partir dos `.md`. Para repovoar do
   zero, importe o conteúdo via SQL Editor (o seed é idempotente por `source_ref`).

### 3. Configurar Stripe

1. Crie uma conta em [stripe.com](https://stripe.com)
2. Copie as chaves de teste em `.env.local`
3. Configure o webhook:

```bash
# Localmente, use Stripe CLI:
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 4. Variáveis de Ambiente

```bash
cp .env.example .env.local
# Preecha com suas chaves do Supabase e Stripe
```

### 5. Rodar localmente

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

### 6. Rodar os testes

```bash
npm test        # fluxos críticos (correção de simulado, gate de acesso)
npm run type-check
```

---

## 🚀 Deploy na Vercel (checklist de produção)

1. **Variáveis de ambiente** (Project Settings → Environment Variables). Atenção
   à separação cliente/servidor:
   - Cliente (expostas no browser): `NEXT_PUBLIC_SUPABASE_URL`,
     `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
     `NEXT_PUBLIC_APP_URL` (= domínio de produção).
   - **Somente servidor** (nunca prefixar com `NEXT_PUBLIC_`):
     `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
2. **Migrations**: rodar `schema.sql` + `migrations/0001..0004` no Supabase de produção.
3. **Webhook Stripe (produção)**: criar endpoint apontando para
   `https://SEU-DOMINIO/api/stripe/webhook`, evento `checkout.session.completed`,
   e colar o signing secret em `STRIPE_WEBHOOK_SECRET`.
   - Mesmo sem webhook, a `/checkout/success` confirma o pagamento na API da
     Stripe e ativa o acesso (fallback). O webhook é a via robusta/idempotente.
4. **Supabase Auth**: em Authentication → URL Configuration, incluir o domínio de
   produção em Site URL e Redirect URLs (`/auth/callback`).
5. Deploy (`vercel` ou push no Git). Conferir o fluxo: signup → checkout →
   acesso liberado → estudar lição → fazer simulado → ver resultado.

---

## 📁 Estrutura do Projeto

Veja **CLAUDE.md** para detalhes completos da estrutura, convenções e como usar com Claude Code.

Resumo rápido:
- `/src/app` — Next.js App Router (pages + layouts)
- `/src/components` — Componentes React reutilizáveis
- `/src/lib` — Utilitários, queries Supabase, auth, etc.
- `/src/types.ts` — Tipos TypeScript (gerados do Supabase)
- `schema.sql` — Schema Supabase
- `CLAUDE.md` — Contexto completo para Claude Code

---

## 🧑‍💻 Desenvolvimento

### Com Claude Code

1. Abra o projeto no VS Code:

```bash
code saas-ibge
```

2. Inicie Claude Code:

```bash
claude
```

3. Primeira mensagem:

```
Leia o CLAUDE.md e o schema.sql. Estamos na Fase 2 - Dashboard.
Preciso que gere [componente/page que você quer].
```

### Comandos úteis

```bash
npm run dev        # Rodar em development
npm run build      # Build de produção
npm start          # Rodar build de produção
npm run type-check # Verificar tipos TypeScript
npm run lint       # Lint com ESLint
npm run format     # Formatar com Prettier
```

---

## 📚 Conteúdo Disponível

Todos os módulos e questões já foram gerados:

- `*-MODULO-*.md` — Conteúdo das aulas (40+ módulos)
- `*-BANCO-DE-*.md` — Questões por módulo (1000+)
- `*-SIMULADO-*.md` — Simulados completos
- `ACA-*.pdf` — Provas oficiais

**Próximo passo:** Importar esses dados para o Supabase (seed script ou admin panel).

---

## 🔐 Segurança

- ✅ Row-Level Security (RLS) ativado em todas as tabelas
- ✅ Auth middleware protege routes autenticadas
- ✅ Stripe webhook assinado e validado
- ✅ `.env.local` está em `.gitignore` (não commitir secrets)
- ✅ Tipos TypeScript garantem validação em tempo de compilação

---

## 📦 Deploy

### Vercel (recomendado)

```bash
# Instale Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Adicione variáveis de ambiente no Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Outros hosts

Qualquer host que suporte Node.js 18+ funciona (Railway, Render, AWS, etc.).

---

## 🐛 Troubleshooting

### "Cannot find module @/..."
- Verifique `tsconfig.json` (paths está correto?)
- Tente: `rm -rf .next && npm run dev`

### Supabase connection error
- Verifique URL e chaves em `.env.local`
- Confirme que o projeto Supabase está ativo

### Stripe webhook não funciona
- Localmente: use `stripe listen --forward-to localhost:3000/...`
- Produção: adicione webhook URL no dashboard Stripe

### TypeScript errors
```bash
npm run type-check  # Para ver todos os erros
```

---

## 🎯 Roadmap

**UI construída (com dados mockados):**

- [x] Schema Supabase + tipos TypeScript
- [x] Configuração Next.js + TypeScript + Tailwind/shadcn
- [x] **Fase 2 — Dashboard:** 8 cards de métrica, progresso por módulo, gráfico de 7 dias, recomendações
- [x] **Fase 3 — Módulos & Lições:** listagem, detalhe do módulo, viewer de lição com quiz
- [x] **Fase 4 — Simulados:** listagem + player com timer, mapa de questões e tela de resultados
- [x] Quiz engine reutilizável (`components/quiz/`)

**Pré-venda — para virar produto vendável (meta 1-2 semanas):**

- [x] 1. Documentação (este README + CLAUDE.md atualizados)
- [ ] 2. Supabase real: client/queries + seed dos `.md` → trocar mocks (`// TODO`)
- [ ] 3. Auth (login/signup + middleware) + Stripe checkout R$97 + webhook
- [ ] 4. Deploy em Vercel (variáveis de ambiente + webhook de produção)
- [ ] 5. Beta users: testar fluxo signup → pagamento → estudo → simulado

> Detalhamento técnico de cada etapa: ver **CLAUDE.md → Roadmap de Pré-venda**.

---

## 📞 Suporte

Para questões sobre a estrutura ou convenções, veja **CLAUDE.md**.

Para configuração de Supabase: [Docs Supabase](https://supabase.com/docs)  
Para Stripe: [Docs Stripe](https://stripe.com/docs)  
Para Next.js: [Docs Next.js](https://nextjs.org/docs)

---

## 📝 Licença

Projeto privado de Kissila. Todos os direitos reservados.
