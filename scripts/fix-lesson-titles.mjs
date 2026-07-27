/**
 * Limpa marcadores de markdown que vazaram para `lessons.title` no seed.
 *
 * Uso:
 *   node scripts/fix-lesson-titles.mjs            # dry-run
 *   node scripts/fix-lesson-titles.mjs --apply
 *
 * Seis títulos guardam sufixos de anotação do .md de origem, ex.:
 *   "Noções de Gerência e Gestão de Pessoas **[gerencial]**"
 * Como nada na UI trata o título como markdown, os asteriscos aparecem crus —
 * inclusive no "Foco de hoje" da dashboard e nas recomendações.
 *
 * Isto é CONTEÚDO COMPARTILHADO: afeta o que todos os usuários veem, e não só a
 * conta de demo. Por isso é um script separado, opt-in.
 *
 * Os marcadores não existem mais nos .md atuais — são resquício de um seed
 * antigo. Ainda assim, se `scripts/seed.mjs` for rodado de novo, vale conferir
 * se ele não os reintroduz.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const APPLY = process.argv.includes('--apply')

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
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

/** Remove sufixos "**[algo]**" e qualquer ** restante. */
function clean(title) {
  return title
    .replace(/\s*\*\*\[[^\]]*\]\*\*\s*/g, ' ')
    .replace(/\*\*/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const { data, error } = await sb.from('lessons').select('id, title')
if (error) {
  console.error('erro lendo lessons:', error.message)
  process.exit(1)
}

const dirty = data.filter((l) => clean(l.title) !== l.title)
console.log(`\n${dirty.length} de ${data.length} títulos a corrigir (${APPLY ? 'APPLY' : 'DRY-RUN'}):\n`)
for (const l of dirty) console.log(`  "${l.title}"\n   → "${clean(l.title)}"`)

if (!APPLY) {
  console.log('\nDRY-RUN — nada foi escrito. Rode de novo com --apply.\n')
  process.exit(0)
}

for (const l of dirty) {
  const { error: uErr } = await sb.from('lessons').update({ title: clean(l.title) }).eq('id', l.id)
  if (uErr) {
    console.error(`erro atualizando ${l.id}:`, uErr.message)
    process.exit(1)
  }
}
console.log(`\n✓ ${dirty.length} títulos corrigidos.\n`)
