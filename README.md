# SaaS IBGE - Estudo para Concurso ACA

Plataforma de estudo online para o concurso de Analista de Gestão (ACA) da IBGE.

**Status:** UI das Fases 2-4 completa (rodando com **dados mockados**) — backend pendente  
**Preço:** R$97 (one-time purchase)  
**Stack:** Next.js 14 | TypeScript | Supabase | Stripe | Tailwind CSS + shadcn/ui

> ⚠️ As telas de estudo (dashboard, módulos, lições, simulados) já funcionam e são navegáveis, mas com **dados de exemplo** (procure `// TODO` no código). Integração com Supabase, auth e Stripe ainda não foi feita — veja o **Roadmap** no fim deste arquivo.

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
3. Execute o schema SQL no Supabase SQL editor:

```bash
# Copie o conteúdo de schema.sql
# Vá para: Project > SQL Editor > New Query
# Cole e execute
```

4. (Opcional) Seed inicial de dados:

```bash
npm run seed  # Será criado depois
```

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
