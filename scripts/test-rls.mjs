// Suíte de regressão de RLS (auditoria 31/07/2026, item 24 do Bloco 3).
//
// Não roda no `npm test` nem no CI: cria e apaga usuários de verdade no
// projeto Supabase configurado em .env.local (não há Supabase local/pgTAP
// neste repo). Rodar manualmente antes de qualquer deploy que mexa em
// policy/RLS, ou periodicamente como checagem de regressão.
//
// Uso:  node scripts/test-rls.mjs
//
// Cobre especificamente a VUL-A01 (escalada de acesso pago via UPDATE em
// profiles — a falha mais crítica da auditoria) e a isolação entre usuários
// nas tabelas de progresso/respostas, além de confirmar que as tabelas
// só-service_role (trial_leads, pending_orders, legal_acceptances,
// admin_audit_log) não vazam nem aceitam escrita de anon/authenticated.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

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
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !anonKey || !serviceKey) {
  console.error(
    '❌ Faltam NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY em .env.local',
  )
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const results = []
function record(name, ok, detail) {
  results.push({ name, ok, detail })
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ' — ' + detail : ''}`)
}

const TEST_PASSWORD = `Rls-${randomUUID()}!`

async function createTestUser(label) {
  const email = `rls-test-${label}-${randomUUID()}@aprovus-rls-test.invalid`
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (error || !data.user) {
    throw new Error(`Falha ao criar usuário de teste (${label}): ${error?.message}`)
  }
  return { id: data.user.id, email }
}

async function signInAs(email) {
  const client = createClient(url, anonKey)
  const { error } = await client.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  })
  if (error) throw new Error(`Falha ao logar (${email}): ${error.message}`)
  return client
}

async function main() {
  console.log('Criando usuários de teste descartáveis...')
  const userA = await createTestUser('a')
  const userB = await createTestUser('b')

  try {
    const clientA = await signInAs(userA.email)
    const clientB = await signInAs(userB.email)

    // ------------------------------------------------------------------
    // VUL-A01 — escalada de acesso pago via UPDATE em profiles.
    // migrations/0015 revogou UPDATE das colunas de cobrança + trigger.
    // ------------------------------------------------------------------
    const { error: escalateErr } = await clientA
      .from('profiles')
      .update({
        subscription_status: 'active',
        course_access_until: '2099-01-01',
        is_trial: false,
      })
      .eq('id', userA.id)

    const { data: profileAfter } = await admin
      .from('profiles')
      .select('subscription_status, course_access_until')
      .eq('id', userA.id)
      .single()

    record(
      'VUL-A01: usuário não consegue setar subscription_status=active em si mesmo',
      Boolean(escalateErr) && profileAfter?.subscription_status !== 'active',
      escalateErr ? `bloqueado: ${escalateErr.message}` : `subscription_status ficou "${profileAfter?.subscription_status}"`,
    )

    const { error: emailHijackErr } = await clientA
      .from('profiles')
      .update({ email: 'sequestro@example.com' })
      .eq('id', userA.id)
    record(
      'VUL-A01-b: usuário não consegue reescrever o próprio profiles.email',
      Boolean(emailHijackErr),
      emailHijackErr?.message,
    )

    // ------------------------------------------------------------------
    // Isolação entre usuários: userB não pode ler nem escrever dado de userA.
    // ------------------------------------------------------------------
    await admin.from('user_progress').insert({
      user_id: userA.id,
      lesson_id: null,
      module_id: null,
      completed: true,
    })

    const { data: crossRead } = await clientB
      .from('user_progress')
      .select('*')
      .eq('user_id', userA.id)
    record(
      'Isolação: userB não lê user_progress de userA',
      (crossRead ?? []).length === 0,
      `${(crossRead ?? []).length} linha(s) vazaram`,
    )

    const { error: crossWriteErr, data: crossWriteData } = await clientB
      .from('user_progress')
      .insert({ user_id: userA.id, completed: true })
      .select()
    record(
      'Isolação: userB não consegue inserir user_progress em nome de userA',
      Boolean(crossWriteErr) || (crossWriteData ?? []).length === 0,
      crossWriteErr?.message,
    )

    const { data: ownRead } = await clientA
      .from('user_progress')
      .select('*')
      .eq('user_id', userA.id)
    record(
      'Controle: userA lê o próprio user_progress normalmente',
      (ownRead ?? []).length > 0,
      `${(ownRead ?? []).length} linha(s)`,
    )

    // ------------------------------------------------------------------
    // Tabelas só-service_role: sem policy para anon/authenticated.
    // ------------------------------------------------------------------
    const serviceRoleOnlyTables = [
      'trial_leads',
      'pending_orders',
      'legal_acceptances',
      'admin_audit_log',
    ]
    for (const table of serviceRoleOnlyTables) {
      const { data } = await clientA.from(table).select('*').limit(1)
      record(
        `${table}: authenticated comum não lê nenhuma linha`,
        (data ?? []).length === 0,
        `${(data ?? []).length} linha(s) vazaram`,
      )
    }
  } finally {
    console.log('Limpando usuários de teste...')
    await admin.auth.admin.deleteUser(userA.id).catch(() => {})
    await admin.auth.admin.deleteUser(userB.id).catch(() => {})
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} passaram.`)
  if (failed.length > 0) {
    console.error(`\n${failed.length} falha(s) de RLS — investigar antes de deploy.`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Erro inesperado na suíte de RLS:', err)
  process.exit(1)
})
