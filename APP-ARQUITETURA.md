# ARQUITETURA & PLANO DE CONSTRUÇÃO — Plataforma de Estudos (Micro SaaS)
## Censo Agro 2026 · base do curso já produzido (Documentos 00–09)

> **Como usar este pacote.** Estes arquivos são a **fundação** do produto: arquitetura, banco de dados (SQL pronto para Supabase) e os algoritmos centrais. Eles **não dependem** da sua UI atual e resolvem a parte mais difícil/arriscada. A camada visual das 12 fases deve ser implementada **dentro do seu repositório**, reaproveitando seus componentes e design system — preferencialmente com o **Claude Code**, que executa contra o seu código real, valida TypeScript e respeita a restrição de **não alterar outras partes do app**.

---

## 1. Stack confirmada
| Camada | Tecnologia |
|---|---|
| Frontend | Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · PWA · **mobile-first** |
| Backend | Supabase: **Auth** · **PostgreSQL + RLS** · **Edge Functions** · **Storage** |
| Pagamentos | Stripe (Checkout + Webhooks) |
| E-mail | Resend |
| IA Tutor | Anthropic API (chamada **server-side** via Edge Function) |
| Estado/dados | TanStack Query + `@supabase/ssr` (sem expor service role no client) |

**Não tocar (sua restrição):** estrutura de auth existente, componentes globais e design system. Tudo deste projeto é **aditivo**, isolado em rotas e pastas próprias (ver §3).

---

## 2. Arquitetura de alto nível
```
┌──────────────────────────── CLIENTE (Next.js PWA, mobile-first) ────────────────────────────┐
│  App Router · Server Components p/ leitura · Client Components p/ interação                   │
│  TanStack Query (cache)  ·  Service Worker (offline de leitura)  ·  Push API                  │
└───────────┬───────────────────────────────────────────────────────────────┬─────────────────┘
            │ @supabase/ssr (JWT do usuário, sujeito a RLS)                   │ fetch p/ rotas server
            ▼                                                                 ▼
┌──────────────────── SUPABASE ────────────────────┐                ┌──────── EDGE FUNCTIONS ────────┐
│ Auth (já existente)                               │                │ stripe-webhook  (service role) │
│ PostgreSQL + RLS  ← TODA a segurança começa aqui  │◄───────────────┤ create-checkout-session        │
│ Storage (PDFs, vídeos, capas)                     │   service role │ ai-tutor (chama Anthropic)     │
│ Views + Triggers (XP, streak, revisões, achiev.)  │                │ run-notifications (cron)       │
└───────────────────────────────────────────────────┘                │ send-weekly-summary (Resend)   │
            ▲                                                          └───────────┬────────────────────┘
            │ webhooks                                                             │
      ┌─────┴───────┐                                                        ┌─────┴─────┐
      │   Stripe    │                                                        │  Resend   │
      └─────────────┘                                                        └───────────┘
```
**Princípio-mestre de segurança:** o cliente **nunca** é confiável. Acesso a dados é controlado por **RLS no Postgres** (cada usuário só vê o que é seu). Webhooks e operações privilegiadas (gravar assinatura/pagamento) ocorrem **só** em Edge Functions com `service_role`.

---

## 3. Estrutura de pastas (aditiva ao seu app)
```
app/
  (study)/                      # grupo de rotas da plataforma — isolado
    layout.tsx                  # usa SEU layout/auth existentes
    dashboard/page.tsx          # Fase 2
    curso/[courseSlug]/
      page.tsx                  # trilha/módulos
      aula/[lessonSlug]/page.tsx# Fase 3 (player + abas)
    cronograma/page.tsx         # Fase 4
    revisoes/page.tsx           # Fase 5
    questoes/page.tsx           # Fase 6
    simulados/
      page.tsx                  # lista
      [examId]/page.tsx         # execução (cronômetro)
      [examId]/resultado/[attemptId]/page.tsx
    tutor/page.tsx              # Fase 8 (IA)
    progresso/page.tsx          # Fase 11 (analytics)
    planos/page.tsx             # Fase 12 (pricing)
components/
  study/                        # componentes NOVOS desta feature
    dashboard/ (StatCard, ProgressRing, NextUpCard, ...)
    lesson/ (LessonPlayer, FlashcardDeck, ChecklistBox, NotesPanel, HighlightLayer)
    questions/ (QuestionCard, AnswerExplanation, FilterBar)
    exam/ (ExamRunner, Timer, ResultReport)
    schedule/ (PlanWizard, CalendarView)
    review/ (ReviewQueue, ReviewCard)
    gamification/ (XpBadge, LevelBar, AchievementToast)
lib/
  study/
    types.ts                    # (entregue) tipos do domínio
    spaced-repetition.ts        # (entregue) algoritmo de revisão
    schedule-generator.ts       # (entregue) gerador + redistribuição
    queries.ts                  # hooks TanStack Query (a criar)
    supabase.ts                 # reuse do seu client existente
supabase/
  migrations/0001_init.sql      # (entregue) schema completo
  functions/                    # edge functions (a criar)
```
> Reaproveite seus primitivos (`Button`, `Card`, `Dialog`, `Tabs`, etc.). Os componentes em `components/study/*` são **novos** e não substituem os globais.

---

## 4. Modelo de dados
A modelagem completa (26 tabelas, enums, índices, RLS, triggers e views) está em **`APP-schema.sql`**, pronta para `supabase db push` ou para colar no SQL Editor. Visão por domínio:

| Domínio | Tabelas |
|---|---|
| Identidade | `profiles` (1:1 com `auth.users`) |
| Conteúdo | `courses` · `modules` · `lessons` · `lesson_checklist_items` · `flashcards` · `questions` · `answers` (alternativas) · `exams` · `exam_questions` |
| Progresso & estudo | `lesson_progress` · `study_plans` · `study_sessions` · `revisions` |
| Personalização da aula | `user_notes` · `user_highlights` · `user_favorites` |
| Questões & simulados | `question_attempts` · `exam_attempts` · `exam_attempt_answers` |
| Gamificação | `achievements` · `user_achievements` · `xp_events` |
| Cobrança | `subscriptions` · `payments` |
| Notificações | `notifications` |

Decisões de modelagem importantes:
- **`profiles`** estende `auth.users` (não duplicamos a tabela de auth do Supabase — o `users` do seu spec = `auth.users`). Um **trigger** cria o profile automaticamente no signup.
- **`answers`** = as **alternativas** (A–E) de cada `question`. As **respostas do usuário** ficam em `question_attempts` (avulsas) e `exam_attempt_answers` (dentro de simulado) — separação que evita confusão e simplifica as métricas.
- **XP, streak, revisões e conquistas** são em grande parte **automáticos via trigger** (ver §5.4 e o SQL), reduzindo lógica no frontend.

---

## 5. Os três "cérebros" do produto

### 5.1. Revisão espaçada — `APP-spaced-repetition.ts`
Intervalos fixos do seu spec: **24h → 7d → 15d → 30d → 60d** (5 estágios). Ao concluir uma aula, são geradas 5 `revisions` com `due_date` calculada. Funções entregues: gerar a fila, classificar **pendente/atrasada**, avançar estágio ao concluir e **reagendar** quando atrasa. (No banco, a criação das revisões já dispara por **trigger** ao completar a aula — o arquivo TS cobre cálculo, exibição e reprogramação no client.)

### 5.2. Gerador de cronograma — `APP-schedule-generator.ts`
Entrada: `dataDaProva`, `horasPorDia`, `diasPorSemana` (quais dias), `nivelDeConhecimento`. Saída: `study_sessions` diárias/semanais/mensais. Lógica:
1. Calcula os **dias úteis de estudo** entre hoje e a prova respeitando os dias da semana escolhidos.
2. Converte em **orçamento de minutos** total e por dia.
3. Ordena as aulas por módulo/peso (ajustável pelo **nível**: iniciante cobre tudo; avançado comprime o básico).
4. Reserva **buffer de revisão** (~30%) e encaixa **simulados** na reta final.
5. Distribui as aulas preenchendo o orçamento diário, sem estourar a capacidade.

### 5.3. Redistribuição (perdeu um dia) — mesma lib
`redistributeAfterMissedDay(sessions, dataPerdida)`: marca as sessões não feitas como `missed`, empurra-as para os próximos dias com capacidade, **reprograma as revisões** afetadas e preserva a data da prova como limite rígido. Idempotente e testável (funções puras).

### 5.4. O que o banco faz sozinho (triggers)
- `handle_new_user` → cria `profiles` no signup.
- Concluir aula (`lesson_progress.status = 'completed'`) → cria as **5 revisões** + concede **XP** + atualiza **streak**.
- Concluir revisão / responder questão / finalizar simulado → concede **XP** e atualiza atividade.
- Após XP → `check_achievements` avalia conquistas (7/30 dias, 100/1000 questões) e desbloqueia.
- `updated_at` automático nas tabelas com edição.

---

## 6. Mapa das 12 fases → o que construir (e em que ordem)

**Ordem recomendada (dependências):** `Schema/Seed → Fase 3 (Estudos) → Fase 5 (Revisão) → Fase 4 (Cronograma) → Fase 6 (Questões) → Fase 7 (Simulados) → Fase 2 (Dashboard) → Fase 10 (Gamificação) → Fase 11 (Analytics) → Fase 12 (Monetização) → Fase 9 (Notificações) → Fase 8 (IA Tutor).` O Dashboard vem depois das features porque ele **agrega** dados que só existem quando elas existem.

| Fase | Entrega | Peças principais |
|---|---|---|
| **2 — Dashboard** | Visão geral inteligente | `StatCard`, `ProgressRing`, `NextUpCard`; lê a view `v_dashboard_stats`; mostra dias p/ prova, horas, metas, próx. aula/revisão/simulado, cards de progresso/desempenho/recordes |
| **3 — Estudos** | Curso→Módulo→Aula→Material | `LessonPlayer` (vídeo/PDF/texto/resumo em **Tabs**), `FlashcardDeck`, `ChecklistBox`, `NotesPanel`, `HighlightLayer`, favoritos; grava `lesson_progress`, `user_notes/highlights/favorites` |
| **4 — Cronograma** | Geração automática | `PlanWizard` (4 perguntas) → `schedule-generator.ts` → grava `study_plans` + `study_sessions`; `CalendarView`; botão "perdi um dia" → redistribuição |
| **5 — Revisão** | Fila espaçada | `ReviewQueue`/`ReviewCard`; lê `v_revisions_due`; dashboard de pendentes/atrasadas/concluídas |
| **6 — Questões** | Banco com filtros | `FilterBar` (disciplina/assunto/banca/dificuldade), `QuestionCard`, `AnswerExplanation`; grava `question_attempts`; métricas (taxa de acerto, tempo médio, evolução) |
| **7 — Simulados** | Prova cronometrada | `ExamRunner` + `Timer`, correção automática, `ResultReport` (nota/acertos/erros/tempo), ranking pessoal, histórico (`exam_attempts`, `exam_attempt_answers`) |
| **8 — IA Tutor** | Assistente | rota `tutor/`, Edge Function `ai-tutor` (chama a Anthropic API **server-side**), chat contextual, resumos e mapas mentais; gating **Premium** |
| **9 — Notificações** | Push/E-mail/WhatsApp | Edge `run-notifications` (cron via `pg_cron`/Scheduled Functions) lê `notifications` agendadas; Resend p/ e-mail; Web Push; WhatsApp opcional |
| **10 — Gamificação** | XP/níveis/conquistas | `XpBadge`, `LevelBar`, `AchievementToast`; XP/streak/conquistas já vêm dos **triggers**; níveis: Iniciante→…→Aprovado |
| **11 — Analytics** | Painel avançado | gráficos (evolução diária/semanal/mensal), disciplinas críticas/dominadas; lê `v_discipline_performance` + agregações |
| **12 — Monetização** | Planos | `planos/page.tsx`; Edge `create-checkout-session` + `stripe-webhook`; gating Básico/Premium/Vitalício (ver §7) |

---

## 7. Monetização & controle de acesso (3 camadas)
Planos: **Básico** (curso, cronograma, revisões) · **Premium** (+ IA Tutor, simulados avançados, relatórios) · **Vitalício** (acesso permanente).

Defesa em profundidade:
1. **Banco (RLS):** colunas `min_plan` em `courses`/`exams` + função `has_plan_access(uid, required)`. Conteúdo Premium não é nem lido por quem não tem plano.
2. **Server (middleware/route handlers):** valida a sessão e o plano antes de renderizar páginas pagas.
3. **UI:** esconde/【bloqueia】recursos e mostra CTA de upgrade.

Fluxo de pagamento: `planos` → `create-checkout-session` (cria Checkout) → Stripe → **`stripe-webhook`** (única fonte da verdade) grava `subscriptions`/`payments` com `service_role`. **O cliente nunca grava assinatura.** Trate `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.paid/payment_failed`. Vitalício = `payments` único → `plan_tier = 'lifetime'` sem `current_period_end`.

> ⚠️ **Não** insiro credenciais nem executo pagamentos — isso é configuração sua no painel da Stripe. O código de integração eu gero; as chaves ficam em variáveis de ambiente do servidor.

---

## 8. Notificações
- **Agendamento:** linhas em `notifications` com `scheduled_for`. Um job (`pg_cron` chamando a Edge `run-notifications`, ou Supabase Scheduled Functions) processa o que venceu e marca `sent_at`.
- **Canais:** `in_app` (badge), **push** (Web Push/Service Worker), **email** (Resend: resumo semanal, evolução, próximas tarefas), **whatsapp** (opcional, via provedor; lembretes/motivação).
- **Gatilhos típicos:** hora de estudar, revisão pendente, simulado agendado, meta não cumprida. Gerados por triggers/cron a partir de `study_sessions` e `revisions`.

---

## 9. Design system (tokens) — premium, clean, educacional
Referências: Notion / Duolingo / Linear. Aplicar via Tailwind config + CSS vars **sem alterar seu tema global** (escopar no grupo `(study)` se necessário).
```
Cores (dark-first):
  --bg:#0B0F17  --surface:#121826  --surface-2:#1A2234  --border:#243049
  --text:#E6EAF2 --muted:#9AA7BD
  --primary:#4F7CFF (ação)  --success:#22C55E  --warn:#F59E0B  --danger:#EF4444
  --accent gradiente: #4F7CFF → #7C5CFF (CTAs, anéis de progresso)
Raios: sm 8 · md 12 · lg 16 · xl 24 (cards)     Sombra: suave, baixa opacidade
Glass (leve): bg rgba(255,255,255,.04) + backdrop-blur 8–12px + borda 1px translúcida
Tipografia: Inter/Geist; títulos 600–700; números grandes nos cards de stat
Motion: 150–250ms ease-out; toasts/anéis animam ao mudar; respeitar prefers-reduced-motion
Feedback: estados de loading (skeleton) e erro SEMPRE; toasts para XP/conquistas
```

---

## 10. PWA & responsividade
- `manifest.json` + Service Worker: **cache de leitura** (aulas/PDFs já abertos disponíveis offline), atualização em rede quando online.
- **Mobile-first** obrigatório; validar em **375 / 768 / 1024 / 1440px**. Navegação inferior no mobile, sidebar no desktop.

---

## 11. Performance & segurança
- **Índices** em todas as FKs e nos filtros quentes (`revisions(user_id, due_date)`, `study_sessions(user_id, scheduled_date)`, `questions(discipline, difficulty)`, `question_attempts(user_id, created_at)`). Já no SQL.
- **Paginação** (range/keyset) em listas grandes de questões; evite `select *` em telas de lista.
- **Server Components** para leitura + cache do TanStack Query no client.
- **RLS em todas as tabelas de usuário**; views com `security_invoker = on` para herdarem a RLS.
- **Segredos** (service role, Stripe, Resend, Anthropic) **apenas** no servidor/edge. Logs prefixados: `console.log('[StudyPlatform]', …)`.
- **Validação de inputs** com Zod nas server actions/edge functions.

---

## 12. Seed de conteúdo (do curso para o banco)
Mapeamento direto dos seus documentos:
| Curso | `courses` (1 linha por trilha: ACA, ACI, AOR, ACR, ACS) — ou 1 curso com `function_tag` nos módulos |
|---|---|
| Módulos 1–5 | `modules` (Português, RLQ, Administração, Informática, Conhec. Técnicos) com `position` e `function_tag` |
| Aulas (ex.: 1.1…3.10) | `lessons` (`content_md` = teoria, `summary_md` = resumo, `pdf_url`, `video_url`) |
| Flashcards de cada aula | `flashcards` (front/back) |
| Macetes/checklist | `lesson_checklist_items` |
| Banco (Docs 07/07A) | `questions` + `answers` (alternativas, `is_correct`), com `discipline`/`difficulty`/`banca='IBFC'` |
| Simulados (Doc 08) | `exams` + `exam_questions` |

Posso gerar um **`seed.sql`** convertendo as aulas e o banco de Administração (já temos ~96 questões) em `INSERT`s prontos — diga e eu produzo.

---

## 13. Próximos passos
1. **Rodar o `APP-schema.sql`** no seu Supabase (ramo de dev).
2. **Plugar os 3 arquivos de `lib/study`** no projeto e validar tipos.
3. Escolher por qual fase começar a UI (sugestão: **Fase 3 → 5 → 4**).
4. Construir fase a fase **no seu repo via Claude Code** (ele roda contra seu código real, reusa seus componentes, valida TS e não altera o resto do app).
5. Quando quiser, eu gero: `seed.sql`, as **Edge Functions** (stripe-webhook, create-checkout-session, ai-tutor, run-notifications, send-weekly-summary) e os **hooks de dados** (`queries.ts`).

> Esta fundação cobre "modelagem completa", "arquitetura ideal" e os mecanismos automáticos (revisão, cronograma, XP). A partir dela, cada fase vira um conjunto pequeno e testável de componentes — do jeito que escala e sem risco para o app existente.
