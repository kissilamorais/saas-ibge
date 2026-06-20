// Seed de conteúdo: importa os arquivos *-MODULO-*.md para as tabelas
// `modules` e `lessons` no Supabase. Idempotente (upsert por slug).
//
// Uso:  node scripts/seed.mjs
// Lê as credenciais de .env.local (usa a service_role para ignorar RLS).
//
// Etapa 2a: módulos + lições. Questões/simulados virão em etapa separada
// (dependem da migration exam_questions).

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// --- Carrega .env.local manualmente (script standalone não passa pelo Next) ---
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
  console.error('❌ Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
})

// --- Manifesto: arquivo .md -> módulo (slug/título/ícone controlados) ---
const MODULES = [
  { file: '02-MODULO-PORTUGUES.md', slug: 'portugues', title: 'Português', icon: 'languages', description: 'Gramática, interpretação de texto, ortografia e redação oficial.' },
  { file: '03-MODULO-RACIOCINIO-LOGICO.md', slug: 'raciocinio-logico', title: 'Raciocínio Lógico', icon: 'brain', description: 'Estruturas lógicas, lógica de argumentação, sequências e probabilidade.' },
  { file: '04-MODULO-ADMINISTRACAO.md', slug: 'administracao', title: 'Administração', icon: 'briefcase', description: 'Administração pública, gestão de processos, planejamento e controle.' },
  { file: '05-MODULOS-INFORMATICA-E-TECNICOS.md', slug: 'informatica', title: 'Informática', icon: 'monitor', description: 'Conceitos de hardware, software, redes, segurança e pacote Office.' },
  { file: '05B-MODULO-CONHECIMENTOS-TECNICOS.md', slug: 'conhecimentos-tecnicos', title: 'Conhecimentos Técnicos', icon: 'book-open', description: 'Conteúdo técnico específico do Censo Agro / cargo ACA.' },
]

// --- Helpers ---
function slugify(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function toTitleCase(str) {
  const small = new Set(['e', 'de', 'da', 'do', 'das', 'dos', 'a', 'o', 'em', 'com', 'para'])
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

function estimateMinutes(text) {
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(10, Math.round(words / 180)) // ~180 palavras/min
}

// Divide o conteúdo do módulo em lições por "## AULA ..."
function parseLessons(content) {
  const lines = content.split('\n')
  const lessons = []
  let current = null
  for (const line of lines) {
    const m = line.match(/^##\s+AULA\s+[\d.]+\s*[—–-]\s*(.+)$/i)
    if (m) {
      if (current) lessons.push(current)
      const rawTitle = m[1].trim()
      current = { title: toTitleCase(rawTitle), body: [] }
    } else if (current) {
      current.body.push(line)
    }
  }
  if (current) lessons.push(current)

  // slugs únicos dentro do módulo
  const seen = new Map()
  return lessons.map((l, i) => {
    let slug = slugify(l.title) || `aula-${i + 1}`
    if (seen.has(slug)) {
      const n = seen.get(slug) + 1
      seen.set(slug, n)
      slug = `${slug}-${n}`
    } else {
      seen.set(slug, 1)
    }
    const content = l.body.join('\n').trim()
    return {
      slug,
      title: l.title,
      content,
      order_index: i,
      duration_minutes: estimateMinutes(content),
    }
  })
}

// --- Execução ---
async function main() {
  let totalLessons = 0
  for (const [i, mod] of MODULES.entries()) {
    const raw = readFileSync(join(root, mod.file), 'utf8')

    const { data: moduleRow, error: modErr } = await supabase
      .from('modules')
      .upsert(
        {
          slug: mod.slug,
          title: mod.title,
          description: mod.description,
          icon: mod.icon,
          order_index: i,
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single()

    if (modErr) {
      console.error(`❌ módulo ${mod.slug}:`, modErr.message)
      process.exit(1)
    }

    const lessons = parseLessons(raw)
    const rows = lessons.map((l) => ({ ...l, module_id: moduleRow.id }))

    const { error: lesErr } = await supabase
      .from('lessons')
      .upsert(rows, { onConflict: 'module_id,slug' })

    if (lesErr) {
      console.error(`❌ lições de ${mod.slug}:`, lesErr.message)
      process.exit(1)
    }

    totalLessons += rows.length
    console.log(`✅ ${mod.title}: ${rows.length} lições`)
  }
  console.log(`\n🌱 Seed concluído: ${MODULES.length} módulos, ${totalLessons} lições.`)
}

main()
