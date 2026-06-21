# SaaS IBGE - Estudo para Concurso ACA

**Status:** MVP integrado — auth, dados, pagamento e gate de acesso funcionando com Supabase/Stripe reais  
**Stack:** Next.js 14 (App Router) | TypeScript | Supabase | Stripe | Tailwind + shadcn/ui  
**Preço:** R$97 (one-time purchase via Stripe)

> ✅ **Estado atual (jun/2026):** as telas de estudo (dashboard, módulos, lições, simulados) consomem **dados reais do Supabase** — não há mais mocks. Já existem: clients Supabase (browser/server/admin), Supabase Auth (login/signup/recuperação de senha), middleware protegendo `/dashboard` e `/checkout`, gate de assinatura por RLS, checkout Stripe (R$97) com webhook idempotente + fallback na página de sucesso, landing pública de vendas e layout com Sidebar/Footer. Banco já seedado.
>
> **Antes de produção:** rodar `migrations/0004` (dedupe de respostas + idempotência do webhook); configurar envs e webhook de produção na Vercel (ver "Deploy"). Testes automatizados cobrem a correção de simulado e o gate de acesso (`npm test`).

---

## 📋 Visão Geral

Plataforma de estudo online para o concurso de Analista de Gestão (ACA) da IBGE. Apresenta:
- Módulos de estudo estruturados (Português, Raciocínio Lógico, Administração, etc.)
- Banco de questões com explicações
- Quiz engine com rastreamento de desempenho
- Simulados completos (provas)
- Dashboard inteligente com métricas de progresso
- Auth (email/senha via Supabase)
- Stripe checkout para R$97

---

## ✅ Pronto (UI com dados mockados)

- **Database:** Schema Supabase completo (`schema.sql`) — 10 tabelas
- **Types:** Tipos TypeScript para todas as tabelas (`types.ts`)
- **Design system:** Tailwind + shadcn/ui (`tailwindcss-animate` instalado); primitivos `Card` e `Progress` em `components/ui/`
- **Base do app:** `app/layout.tsx` (fonte Inter, metadata) + `styles/globals.css` (variáveis CSS light/dark)
- **Fase 2 – Dashboard** (`app/dashboard/page.tsx`): 8 cards de métrica (`DashboardCard`), `ProgressWidget`, `StudyChart` (7 dias, Tailwind puro), `RecommendationCard`
- **Fase 3 – Módulos & Lições:** listagem (`dashboard/modules/page.tsx` + `ModuleCard`), detalhe do módulo (`[moduleSlug]/page.tsx`), viewer de lição (`[lessonSlug]/page.tsx` + `LessonViewer`) com quiz integrado
- **Fase 4 – Simulados:** listagem (`dashboard/exams/page.tsx`), player (`exams/[examSlug]/page.tsx`) com timer regressivo, mapa de questões e tela de resultados
- **Quiz engine reutilizável** (`components/quiz/`): `QuestionCard` (fonte única; usado por lição, simulado e revisão), `QuizEngine`, `ResultsScreen`
- **Conteúdo bruto:** ~40 módulos .md + 1000+ questões + 8 simulados (ainda **não importados** pro banco)

## 🚧 Em Falta (Prioridade) — "Pré-venda"

> Objetivo: produto pronto pra vender. Meta 1-2 semanas. Detalhes e checklist no fim do arquivo.

1. **Documentação** (CLAUDE.md + README atualizados) — ✅ em andamento
2. **Supabase real + seed:** client (`lib/supabase/{client,server}.ts`), queries (`lib/supabase/queries.ts`), seed dos .md/simulados; trocar mocks por dados reais (buscar pelos `// TODO`)
3. **Auth + Stripe:** login/signup, middleware protegendo `/dashboard` e `/checkout`, checkout R$97 + webhook que ativa `subscription_status`
4. **Deploy Vercel** com variáveis de ambiente
5. **Beta users:** testar fluxo completo (signup → pagamento → estudo → simulado)

### Pendências de UI ainda não construídas
- Navbar / Sidebar / Footer globais (pastas existem, arquivos não)
- Páginas de `auth/login`, `auth/signup`, `checkout`
- Quiz de prática avulso por banco de questões (hoje só lição e simulado)
- Fase 5 – Admin & Analytics (upload de conteúdo, métricas de usuários)

---

## 🏗️ Estrutura de Pastas

```
saas-ibge/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home / Dashboard
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/route.ts
│   │   ├── dashboard/
│   │   │   ├── page.tsx            # Dashboard principal
│   │   │   ├── modules/page.tsx    # Listagem de módulos
│   │   │   ├── [moduleSlug]/
│   │   │   │   ├── page.tsx        # Módulo detalhes
│   │   │   │   └── [lessonSlug]/page.tsx  # Lição
│   │   │   ├── exam/[examSlug]/page.tsx   # Simulado
│   │   │   └── results/page.tsx
│   │   ├── checkout/page.tsx       # Stripe checkout
│   │   ├── api/
│   │   │   ├── auth/[...nextauth].ts
│   │   │   ├── stripe/webhook.ts
│   │   │   ├── modules/route.ts
│   │   │   ├── lessons/route.ts
│   │   │   ├── questions/route.ts
│   │   │   ├── progress/route.ts
│   │   │   └── study-session/route.ts
│   │   └── error.tsx, loading.tsx, not-found.tsx
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardCard.tsx
│   │   │   ├── ProgressWidget.tsx
│   │   │   ├── StudyChart.tsx
│   │   │   └── RecommendationCard.tsx
│   │   ├── modules/
│   │   │   ├── ModuleCard.tsx
│   │   │   └── ModuleList.tsx
│   │   ├── lessons/
│   │   │   ├── LessonViewer.tsx
│   │   │   └── LessonNavigation.tsx
│   │   ├── quiz/
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── QuizEngine.tsx
│   │   │   └── ResultsScreen.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Loading.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── queries.ts
│   │   ├── stripe/
│   │   │   └── client.ts
│   │   ├── auth/
│   │   │   └── middleware.ts
│   │   ├── utils.ts
│   │   └── hooks.ts
│   ├── styles/
│   │   └── globals.css
│   └── types.ts
├── public/
│   ├── images/
│   └── icons/
├── .env.local              # NUNCA commitar
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── schema.sql              # Schema Supabase

```

---

## 🔧 Convenções de Código

### Pastas e Nomes
- `[slug]` = dynamic routes
- `_private` = private components (não exportadas)
- `use*` = React hooks custom
- `get*`, `fetch*` = functions de dados

### Componentes
```typescript
// Componentes devem ser .tsx se usarem JSX
// Type-first:
interface ComponentProps {
  title: string
  isLoading?: boolean
  onSubmit: (data: Data) => Promise<void>
}

export function ComponentName({ title, isLoading = false, onSubmit }: ComponentProps) {
  // Implementation
}
```

### API Routes
```typescript
// /app/api/[resource]/route.ts - RESTful
// GET, POST, PUT, DELETE apenas
// Always return JSON { data, error } ou { success: boolean }

export async function GET(req: Request) {
  try {
    const data = await fetchData()
    return Response.json({ data })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
```

### Supabase Queries
```typescript
// lib/supabase/queries.ts
import { Database } from '@/types'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Sempre type-check
export async function getModules(): Promise<Database['public']['Tables']['modules']['Row'][]> {
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .order('order_index')
  
  if (error) throw error
  return data ?? []
}
```

### Styling
- Tailwind only (não adicionar CSS custom se possível)
- shadcn/ui para componentes complexos
- Classes: `className="flex items-center gap-4"`
- Dark mode: via Tailwind (aplica automaticamente)

### Imports
```typescript
// Ordem: 1) Node/React, 2) Next, 3) Libs, 4) Local
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
```

---

## 🚀 Como Usar com Claude Code

### Primeira mensagem:
```
Leia o CLAUDE.md e o schema.sql. Estamos na Fase 2 - Dashboard Principal.
Preciso dos seguintes componentes: [lista aqui o que quer implementar].
```

### Commands úteis no Claude Code:
- `/compact` — comprime contexto quando ficar perto do limite
- `/clear` — limpa histórico (relê o CLAUDE.md automaticamente)
- `claude/turbo` — modo rápido (menos verboso)
- `@type:file` — para referir-se a arquivos específicos

### Fluxo recomendado:
1. Gere 1 componente/page por mensagem (não tudo junto)
2. Use `/compact` a cada 5-8 gerações
3. Comece pelos componentes (reutilizáveis), depois pages
4. Deixe API routes para o final (mais fáceis com contexto claro)

---

## 📦 Variáveis de Ambiente (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🧪 Testes & Deploy

- **Local:** `npm run dev` (porta 3000)
- **Build:** `npm run build` → `npm start`
- **Type-check:** `npm run type-check` antes de push
- **Deploy:** Vercel (recomendado para Next.js + Supabase)

---

## 📚 Conteúdo Disponível

Todos os módulos e questões já foram gerados e estão em markdown (.md):
- `*-MODULO-*.md` = conteúdo das aulas
- `*-BANCO-DE-*.md` = banco de questões por módulo
- `*-SIMULADO-*.md` = questões de simulado
- `ACA-*.pdf` = provas oficiais

**Tarefa:** Importar esses dados pro Supabase via seed script ou admin panel.

---

## 🔐 Segurança

- **RLS ativado** em todas as tabelas (só vê dados próprios)
- **Auth middleware** protege /dashboard e /checkout
- **CORS:** Apenas localhost:3000 em dev
- **Secrets:** Nunca commitar .env.local (está em .gitignore)

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
- [ ] Admin panel (upload/manage)
- [ ] Analytics avançadas
- [ ] Deploy em Vercel (envs + webhook de produção)

---

## 🚀 Roadmap de Pré-venda (1-2 semanas)

Sequência para sair do estado "UI mockada" e chegar a "produto vendável".

### 1. Documentação ✅
- CLAUDE.md + README refletindo o estado real (UI mockada, o que falta).

### 2. Supabase real + seed
- Criar projeto no Supabase; rodar `schema.sql` no SQL Editor.
- Implementar `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server components/route handlers) e `lib/supabase/queries.ts` (funções tipadas via `Database` de `types.ts`).
- Escrever `scripts/seed.ts` que parseia os `.md` (`*-MODULO-*`, `*-BANCO-*`, `*-SIMULADO-*`) e popula `modules / lessons / questions / question_options / exams`.
- Substituir cada `mock*`/`// TODO` das pages por chamadas reais (server components fazem `await`).

### 3. Auth + Stripe
- `auth/login` e `auth/signup` (Supabase Auth email/senha) + `auth/callback/route.ts`.
- `lib/auth/middleware.ts` (ou `middleware.ts` na raiz) protegendo `/dashboard` e `/checkout`.
- `checkout/page.tsx` + `api/stripe/route.ts` (Checkout Session R$97 one-time) + `api/stripe/webhook` que, no `checkout.session.completed`, seta `profiles.subscription_status = 'active'` e `course_access_until`.
- Gate de acesso: páginas de estudo exigem `subscription_status = 'active'`.

### 4. Deploy Vercel
- `vercel` + variáveis de ambiente (ver seção de env).
- Webhook Stripe de produção apontando pra `/api/stripe/webhook`.
- `NEXT_PUBLIC_APP_URL` = domínio de produção.

### 5. Beta users
- Testar fluxo ponta a ponta: signup → checkout → acesso → estudar lição → fazer simulado → ver resultado.
- Coletar feedback; smoke test em mobile.

---

## 📞 Notas Finais

- Stack é estável e well-tested.
- Foca em UX clean e rápido (mobile-first).
- Stripe integra webhook para ativar subscription.
- Supabase Edge Functions pode ser usado para lógica serverless pesada.
- Componentes devem ser reutilizáveis (props bem tipadas).
