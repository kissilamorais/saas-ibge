/**
 * Popula UMA conta de demonstração com progresso avançado (~97% do edital),
 * para gravação de screencast dos criativos.
 *
 * Uso:
 *   node scripts/demo-seed-progress.mjs --email demo@exemplo.com --dry-run
 *   node scripts/demo-seed-progress.mjs --email demo@exemplo.com --apply
 *   node scripts/demo-seed-progress.mjs --email demo@exemplo.com --apply --password 'SenhaForte123'
 *
 * Escreve com a service_role (ignora RLS), então há duas travas:
 *   1. `--email` é obrigatório e TODA escrita é filtrada por `user_id` desse
 *      e-mail. Nenhuma query toca outro usuário.
 *   2. Sem `--apply` o script roda em dry-run e só imprime o plano.
 *
 * Idempotente: apaga o progresso ANTERIOR desse mesmo usuário antes de inserir,
 * então rodar duas vezes produz o mesmo estado (não duplica horas/simulados).
 *
 * ATENÇÃO: os dados gerados são sintéticos (demo/marketing). Não confundir com
 * métricas de aluno real em relatórios ou analytics.
 *
 * O que é gerado, e por que cada número:
 *   - 59 de 61 lições concluídas → round(59/61) = 97% no anel do edital.
 *     As 2 pendentes são as ÚLTIMAS de Administração, então "Continue de onde
 *     parou" (nextLesson) aponta para uma lição de Administração.
 *   - 33 dias de sessões de estudo, ~80h no total, com os 12 dias mais recentes
 *     consecutivos (streak = 12) e um dia de folga em D-12 para fechar a
 *     sequência em exatamente 12.
 *   - Últimos 7 dias somam 26,5h (meta semanal 25h) e hoje soma 4h (meta
 *     diária 4h) → os dois GoalRings aparecem completos.
 *
 * TIMEZONE — por que tudo é gerado em UTC:
 *   getDashboardData() agrupa as sessões por dia usando `new Date()` e
 *   getFullYear/Month/Date, ou seja, no fuso do SERVIDOR. Na Vercel isso é UTC,
 *   que de noite no Brasil (BRT = UTC-3) já virou o dia seguinte. Timestamps
 *   gravados em horário local caíam no dia errado e a dashboard mostrava
 *   "Hoje 0/4h". Por isso ancoramos tudo em dias UTC, ao meio-dia UTC (09h BRT),
 *   longe das duas viradas de dia.
 *
 * O "hoje" e o streak são relativos ao momento da execução — RODE O SCRIPT
 * LOGO ANTES DE GRAVAR para o anel "Hoje" e a sequência de 12 dias baterem.
 *   - Simulados 2/3/4 com 48, 52 e 55 acertos (80/87/92%), um por semana, em
 *     ordem crescente. A Simulação Final fica sem resultado.
 *   - user_answers coerentes com cada nota, para que aproveitamento por módulo
 *     e recomendações batam com os simulados.
 *   - Conquistas (src/lib/dashboard/achievements.ts) são DERIVADAS — não há
 *     tabela. Com estes números as 8 acendem: 1ª lição, 1ª semana (bestStreak
 *     >= 7), 25/50/75% do edital, 1º simulado, 3 simulados e 50 horas.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// --- Configuração do perfil de demo ---

const TARGET_FUNCTION = 'aca'
const FULL_NAME = 'Matheus Duarte'
const EXAM_DATE = '2026-09-27'
const DAILY_GOAL_HOURS = 4
const WEEKLY_GOAL_HOURS = 25
/** Quantas lições ficam pendentes, contadas do FIM deste módulo. */
const PENDING_MODULE_SLUG = 'administracao'
const PENDING_LESSONS = 2

/**
 * Minutos estudados por dia, indexado por "dias atrás" (0 = hoje).
 * 0 = dia de folga. Índices 0..11 são todos > 0 (streak de 12); o índice 12 é
 * folga, o que fecha a sequência atual em exatamente 12 dias.
 */
const MINUTES_BY_DAYS_AGO = [
  240, 240, 210, 240, 210, 240, 210, // D0..D6  → 26,5h na semana (folga sobre a meta de 25h)
  180, 150, 210, 180, 150,           // D7..D11 → completa o streak de 12
  0,                                 // D12     → folga (encerra o streak)
  180, 150, 0, 210, 180, 120, 150,   // D13..D19
  195, 0, 150, 210, 120, 180, 150,   // D20..D26
  0, 0, 120, 120, 120, 0,            // D27..D32
]

/**
 * Simulados: acertos sobre 60 e em que dia foram feitos. Um por semana,
 * começando ~3 semanas atrás, com nota crescente. `examMinutes` sai do total
 * do dia (não soma por cima), então as horas continuam batendo com o plano.
 */
const EXAM_PLAN = [
  { slug: 'simulado-2-aca', score: 48, daysAgo: 20, examMinutes: 195 },
  { slug: 'simulado-3-aca', score: 52, daysAgo: 13, examMinutes: 182 },
  { slug: 'simulado-4-aca', score: 55, daysAgo: 6, examMinutes: 168 },
]
/** Nota mínima para `passed` — espelha PASS_PERCENT em src/lib/study/scoring.ts. */
const PASS_PERCENT = 70

// --- CLI ---

const argv = process.argv.slice(2)
function flag(name) {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && !argv[i + 1]?.startsWith('--') ? argv[i + 1] : null
}
const EMAIL = flag('email')
const APPLY = argv.includes('--apply')
const PASSWORD = flag('password') ?? `Demo!${randomBytes(6).toString('base64url')}`

if (!EMAIL) {
  console.error('Faltou --email. Ex: node scripts/demo-seed-progress.mjs --email demo@x.com --dry-run')
  process.exit(1)
}

// --- Conexão (service_role, igual ao scripts/seed.mjs) ---

function loadEnv() {
  const raw = readFileSync(join(root, '.env.local'), 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    let val = m[2].trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    env[m[1]] = val
  }
  return env
}

const env = loadEnv()
const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY em .env.local')
  process.exit(1)
}
const sb = createClient(url, serviceKey, { auth: { persistSession: false } })

// --- Helpers ---

/** RNG determinístico (mulberry32) — mesma seed ⇒ mesmas respostas erradas. */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function shuffled(arr, rand) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Meia-noite UTC de hoje — o mesmo corte de dia que o servidor da dashboard usa.
const now = new Date()
const startOfToday = new Date(
  Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
)

/** Timestamp UTC no dia `daysAgo`, às `hour:minute` UTC. */
function at(daysAgo, hour, minute = 0) {
  return new Date(
    startOfToday.getTime() + (hour * 60 + minute) * 60000 - daysAgo * 86400000
  )
}

function die(msg, error) {
  console.error(`✗ ${msg}${error ? `: ${error.message ?? error}` : ''}`)
  process.exit(1)
}

// --- 1. Usuário ---

console.log(`\n▸ Conta de demo: ${EMAIL}  (${APPLY ? 'APPLY' : 'DRY-RUN'})\n`)

const { data: existingProfile, error: profErr } = await sb
  .from('profiles')
  .select('id, email, target_function, subscription_status')
  .eq('email', EMAIL)
  .maybeSingle()
if (profErr) die('erro lendo profiles', profErr)

let userId = existingProfile?.id ?? null
let createdUser = false

if (userId) {
  console.log(`  perfil encontrado — id ${userId}`)
} else if (!APPLY) {
  console.log('  perfil NÃO existe → seria criado (auth.users + trigger handle_new_user)')
} else {
  // O trigger on_auth_user_created cria a linha em `profiles` automaticamente.
  const { data: created, error: cErr } = await sb.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: FULL_NAME },
  })
  if (cErr) die('erro criando usuário', cErr)
  userId = created.user.id
  createdUser = true
  console.log(`  usuário criado — id ${userId}`)
}

// --- 2. Catálogo da trilha ---

const { data: mods, error: mErr } = await sb
  .from('modules')
  .select('id, slug, title, order_index, lessons(id, slug, title, order_index, duration_minutes)')
  .contains('functions', [TARGET_FUNCTION])
  .order('order_index', { ascending: true })
if (mErr) die('erro lendo modules', mErr)

for (const m of mods) {
  m.lessons = (m.lessons ?? []).sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
}
mods.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

// Ordem de estudo = ordem do catálogo. As pendentes saem do fim do módulo alvo.
const allLessons = mods.flatMap((m) => m.lessons.map((l) => ({ ...l, module_id: m.id, moduleSlug: m.slug })))
const pendingModule = mods.find((m) => m.slug === PENDING_MODULE_SLUG)
if (!pendingModule) die(`módulo "${PENDING_MODULE_SLUG}" não encontrado na trilha ${TARGET_FUNCTION}`)
const pendingIds = new Set(pendingModule.lessons.slice(-PENDING_LESSONS).map((l) => l.id))
const toComplete = allLessons.filter((l) => !pendingIds.has(l.id))

const syllabusPct = Math.round((toComplete.length / allLessons.length) * 100)
console.log(`  lições: ${toComplete.length}/${allLessons.length} concluídas → ${syllabusPct}% do edital`)
console.log(`  pendentes: ${pendingModule.lessons.slice(-PENDING_LESSONS).map((l) => l.title).join(' · ')}`)

// --- 3. Plano de sessões de estudo ---

const studyDays = MINUTES_BY_DAYS_AGO
  .map((minutes, daysAgo) => ({ daysAgo, minutes }))
  .filter((d) => d.minutes > 0)

const totalMinutes = studyDays.reduce((s, d) => s + d.minutes, 0)
const weekMinutes = MINUTES_BY_DAYS_AGO.slice(0, 7).reduce((s, m) => s + m, 0)
const todayMinutes = MINUTES_BY_DAYS_AGO[0]

// Streak atual: dias consecutivos com estudo a partir de hoje.
let currentStreak = 0
while (MINUTES_BY_DAYS_AGO[currentStreak] > 0) currentStreak++

console.log(
  `  estudo: ${(totalMinutes / 60).toFixed(1)}h em ${studyDays.length} dias · ` +
  `semana ${(weekMinutes / 60).toFixed(1)}h/${WEEKLY_GOAL_HOURS}h · ` +
  `hoje ${(todayMinutes / 60).toFixed(1)}h/${DAILY_GOAL_HOURS}h · streak ${currentStreak}`
)

// Distribui as lições pelos dias, proporcionalmente às horas do dia, do mais
// antigo para o mais recente (progresso cronológico coerente).
const chronological = [...studyDays].sort((a, b) => b.daysAgo - a.daysAgo)
const lessonDayIndex = toComplete.map((_, i) => {
  const frac = (i + 0.5) / toComplete.length
  let acc = 0
  for (let d = 0; d < chronological.length; d++) {
    acc += chronological[d].minutes / totalMinutes
    if (frac <= acc) return d
  }
  return chronological.length - 1
})

const progressRows = toComplete.map((l, i) => {
  const day = chronological[lessonDayIndex[i]]
  const ts = at(day.daysAgo, 12, (i * 7) % 55).toISOString()
  return {
    user_id: userId,
    lesson_id: l.id,
    module_id: l.module_id,
    completed: true,
    completion_percentage: 100,
    last_accessed_at: ts,
    completed_at: ts,
  }
})

// --- 4. Simulados: resultados + respostas ---

const examRows = []
const answerRows = []
/** dia → minutos já consumidos por sessão de simulado. */
const examMinutesByDay = new Map()

for (const plan of EXAM_PLAN) {
  const { data: exam, error: eErr } = await sb
    .from('exams')
    .select('id, slug, title, total_questions')
    .eq('slug', plan.slug)
    .single()
  if (eErr) die(`simulado ${plan.slug} não encontrado`, eErr)

  const { data: eq, error: eqErr } = await sb
    .from('exam_questions')
    .select('question_id, order_index')
    .eq('exam_id', exam.id)
    .order('order_index', { ascending: true })
  if (eqErr) die(`erro lendo exam_questions de ${plan.slug}`, eqErr)

  const questionIds = eq.map((r) => r.question_id)
  const total = exam.total_questions ?? questionIds.length
  const percentage = Math.round((plan.score / total) * 100)

  const { data: opts, error: oErr } = await sb
    .from('question_options')
    .select('id, question_id, is_correct')
    .in('question_id', questionIds)
  if (oErr) die(`erro lendo question_options de ${plan.slug}`, oErr)

  const byQuestion = new Map()
  for (const o of opts) {
    const cur = byQuestion.get(o.question_id) ?? { correct: null, wrong: [] }
    if (o.is_correct) cur.correct = o.id
    else cur.wrong.push(o.id)
    byQuestion.set(o.question_id, cur)
  }

  // Seed derivada do slug → mesmas questões erradas a cada execução.
  const seed = [...plan.slug].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)
  const rand = rng(seed)
  const wrongIds = new Set(shuffled(questionIds, rand).slice(0, total - plan.score))

  for (const qid of questionIds) {
    const o = byQuestion.get(qid)
    if (!o?.correct) continue
    const wrong = wrongIds.has(qid) && o.wrong.length > 0
    answerRows.push({
      user_id: userId,
      question_id: qid,
      selected_option_id: wrong ? o.wrong[Math.floor(rand() * o.wrong.length)] : o.correct,
      is_correct: !wrong,
      attempted_at: at(plan.daysAgo, 14).toISOString(),
    })
  }

  const completedAt = at(plan.daysAgo, 14 + Math.floor(plan.examMinutes / 60), plan.examMinutes % 60)
  const startedAt = new Date(completedAt.getTime() - plan.examMinutes * 60000)
  examRows.push({
    user_id: userId,
    exam_id: exam.id,
    score: plan.score,
    total_questions: total,
    percentage,
    passed: percentage >= PASS_PERCENT,
    time_spent_minutes: plan.examMinutes,
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
  })
  examMinutesByDay.set(plan.daysAgo, plan.examMinutes)
  console.log(`  ${exam.title}: ${plan.score}/${total} (${percentage}%) em D-${plan.daysAgo}`)
}

// --- 5. Sessões de estudo (o tempo de simulado sai do total do dia) ---

const sessionRows = []
for (const day of studyDays) {
  const examMin = examMinutesByDay.get(day.daysAgo) ?? 0
  if (examMin > 0) {
    const end = at(day.daysAgo, 14 + Math.floor(examMin / 60), examMin % 60)
    sessionRows.push({
      user_id: userId,
      module_id: null,
      lesson_id: null,
      started_at: new Date(end.getTime() - examMin * 60000).toISOString(),
      ended_at: end.toISOString(),
      duration_minutes: examMin,
    })
  }
  const rest = day.minutes - examMin
  if (rest > 0) {
    // Módulo da última lição concluída nesse dia (null se o dia só teve revisão).
    const idx = lessonDayIndex.lastIndexOf(chronological.findIndex((d) => d.daysAgo === day.daysAgo))
    // 09:00 UTC + no máximo 4h → nunca cruza a virada do dia UTC.
    const start = at(day.daysAgo, 9)
    sessionRows.push({
      user_id: userId,
      module_id: idx >= 0 ? toComplete[idx].module_id : null,
      lesson_id: null,
      started_at: start.toISOString(),
      ended_at: new Date(start.getTime() + rest * 60000).toISOString(),
      duration_minutes: rest,
    })
  }
}

console.log(
  `\n  a inserir: ${progressRows.length} user_progress · ${sessionRows.length} study_sessions · ` +
  `${examRows.length} user_exam_results · ${answerRows.length} user_answers`
)

if (!APPLY) {
  console.log('\n▸ DRY-RUN — nada foi escrito. Rode de novo com --apply.\n')
  process.exit(0)
}

// --- 6. Escrita (tudo filtrado por user_id — nenhum outro usuário é tocado) ---

const purchaseDate = at(35, 10).toISOString()
const { error: upErr } = await sb
  .from('profiles')
  .update({
    full_name: FULL_NAME,
    target_function: TARGET_FUNCTION,
    subscription_status: 'active',
    purchase_date: purchaseDate,
    course_access_until: at(-365, 10).toISOString(),
    exam_date: EXAM_DATE,
    daily_goal_hours: DAILY_GOAL_HOURS,
    weekly_goal_hours: WEEKLY_GOAL_HOURS,
  })
  .eq('id', userId)
if (upErr) die('erro atualizando profile', upErr)
console.log('  ✓ profile atualizado (trilha aca, acesso ativo, meta 4h/25h, prova 27/09/2026)')

// Limpa o progresso anterior DESTE usuário para o script ser re-executável.
for (const table of ['user_answers', 'user_exam_results', 'study_sessions', 'user_progress']) {
  const { error } = await sb.from(table).delete().eq('user_id', userId)
  if (error) die(`erro limpando ${table}`, error)
}
console.log('  ✓ progresso anterior deste usuário limpo')

async function insertAll(table, rows, chunk = 200) {
  for (let i = 0; i < rows.length; i += chunk) {
    const { error } = await sb.from(table).insert(rows.slice(i, i + chunk))
    if (error) die(`erro inserindo em ${table}`, error)
  }
  console.log(`  ✓ ${rows.length} linhas em ${table}`)
}

await insertAll('user_progress', progressRows)
await insertAll('study_sessions', sessionRows)
await insertAll('user_exam_results', examRows)
await insertAll('user_answers', answerRows)

// --- 7. Verificação (relê do banco e recalcula como a dashboard faria) ---

const { count: doneCount } = await sb
  .from('user_progress')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('completed', true)
const { data: sess } = await sb
  .from('study_sessions')
  .select('duration_minutes, started_at')
  .eq('user_id', userId)
const { data: results } = await sb
  .from('user_exam_results')
  .select('exam_id, score, percentage, completed_at')
  .eq('user_id', userId)
  .order('completed_at')

const mins = (sess ?? []).reduce((s, r) => s + (r.duration_minutes ?? 0), 0)
// "Hoje" e "esta semana" com o mesmo corte UTC que o servidor da dashboard usa.
const weekStart = startOfToday.getTime() - 6 * 86400000
let dailyMin = 0
let weeklyMin = 0
for (const r of sess ?? []) {
  const t = new Date(r.started_at).getTime()
  if (t >= startOfToday.getTime()) dailyMin += r.duration_minutes ?? 0
  if (t >= weekStart) weeklyMin += r.duration_minutes ?? 0
}
const days = new Set(
  (sess ?? []).map((r) => {
    const d = new Date(r.started_at)
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  })
)
let streak = 0
let cursor = days.has(startOfToday.getTime()) ? startOfToday.getTime() : startOfToday.getTime() - 86400000
while (days.has(cursor)) {
  streak++
  cursor -= 86400000
}

console.log('\n▸ Verificação (lida do banco):')
console.log(`  edital: ${doneCount}/${allLessons.length} = ${Math.round((doneCount / allLessons.length) * 100)}%`)
console.log(`  horas: ${(mins / 60).toFixed(1)}h · dias de estudo: ${days.size} · streak: ${streak}`)
console.log(
  `  hoje: ${(dailyMin / 60).toFixed(1)}h/${DAILY_GOAL_HOURS}h · ` +
  `semana: ${(weeklyMin / 60).toFixed(1)}h/${WEEKLY_GOAL_HOURS}h (cortes em UTC, como o servidor)`
)
console.log(`  simulados: ${(results ?? []).map((r) => `${r.score}/60 (${r.percentage}%)`).join(' → ')}`)
if (createdUser) console.log(`\n  SENHA da conta de demo: ${PASSWORD}`)
console.log('')
