// Seed de questões + simulados: importa os bancos (07A–07J) para `questions` +
// `question_options`, e os simulados (08*) para `exams` + `exam_questions`.
//
// Uso:  node scripts/seed-questions.mjs
// Requer: migrations 0001 e 0002 já aplicadas no banco (RLS, exam_questions,
//         questions.source_ref). Usa a service_role para ignorar RLS.
//
// Idempotente: upsert de questions por `source_ref`; opções e vínculos de
// simulado são recriados (delete + insert) por escopo a cada execução.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// --- Carrega .env.local manualmente ---
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

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

const LETTERS = ['A', 'B', 'C', 'D', 'E']

// --- Manifestos ---
const BANCO_FILES = [
  { file: '07A-BANCO-ADMINISTRACAO-ACA-LOTE1.md', module: 'administracao' },
  { file: '07D-BANCO-ADMINISTRACAO-ACA-LOTE2.md', module: 'administracao' },
  { file: '07B-BANCO-CONHECIMENTOS-TECNICOS-LOTE1.md', module: 'conhecimentos-tecnicos' },
  { file: '07C-BANCO-CONHECIMENTOS-TECNICOS-LOTE2.md', module: 'conhecimentos-tecnicos' },
  { file: '07E-BANCO-PORTUGUES-LOTE1.md', module: 'portugues' },
  { file: '07F-BANCO-PORTUGUES-LOTE2.md', module: 'portugues' },
  { file: '07G-BANCO-RACIOCINIO-LOGICO-LOTE1.md', module: 'raciocinio-logico' },
  { file: '07H-BANCO-RACIOCINIO-LOGICO-LOTE2.md', module: 'raciocinio-logico' },
  { file: '07I-BANCO-INFORMATICA-LOTE1.md', module: 'informatica' },
  { file: '07J-BANCO-INFORMATICA-LOTE2.md', module: 'informatica' },
]

const SIMULADO_FILES = [
  '08A-SIMULADO-2-ACA.md',
  '08B-SIMULADO-3-ACA.md',
  '08C-SIMULADO-4-ACA.md',
  '08D-SIMULADO-FINAL-ACA.md',
  '08E-SIMULADO-1-ACR.md',
  '08F-SIMULADO-1-ACS.md',
  '08G-SIMULADO-1-ACI.md',
  '08H-SIMULADO-1-AOR.md',
]

// --- Helpers ---
function slugify(str) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Deriva o cargo do simulado pelo nome do arquivo (ex.: 08E-SIMULADO-1-ACR.md -> 'acr').
function functionFromFile(file) {
  const m = file.match(/-(ACA|ACI|AOR|ACR|ACS)\.md$/i)
  return m ? m[1].toLowerCase() : null
}

function difficultyFromCode(code) {
  // ex.: ADM-F01 / ADM2-M03 / POR-D12  -> letra após o "-"
  const m = code.match(/-([FMD])/i)
  if (!m) return null
  return { F: 'easy', M: 'medium', D: 'hard' }[m[1].toUpperCase()] ?? null
}

function disciplineToModule(name) {
  const n = name.toLowerCase()
  if (n.includes('portugu')) return 'portugues'
  if (n.includes('racioc')) return 'raciocinio-logico'
  if (n.includes('administ')) return 'administracao'
  if (n.includes('inform')) return 'informatica'
  if (n.includes('tecnic') || n.includes('técnic')) return 'conhecimentos-tecnicos'
  return null
}

// Divide um texto "A) .. B) .. C) .." em opções. Tolera ✔️ e parêntese full-width.
function parseOptions(text) {
  const re = /([A-E])[\)）]\s*([\s\S]*?)(?=\s(?:[A-E])[\)）]|$)/g
  const out = []
  let m
  while ((m = re.exec(text)) !== null) {
    const letter = m[1]
    const clean = m[2].replace(/✔️/g, '').replace(/\s+/g, ' ').trim()
    out.push({ letter, text: clean })
  }
  return out
}

// --- Parser de banco ---
function parseBanco(content) {
  const lines = content.split('\n')
  const codeRe = /^\*\*([A-Z0-9]+-[A-Z]+\d+)\.\*\*\s*(.*)$/
  const explRe = /^>\s*✔️?\s*\*\*([A-E])[.\)]?\*\*\s*(.*)$/
  const questions = []
  let cur = null

  const finalize = () => {
    if (!cur) return
    const options = parseOptions(cur.optsText)
    if (cur.correct && options.length >= 2) {
      questions.push({ ...cur, options })
    } else {
      console.warn(`  ⚠️  ignorada ${cur.code} (correct=${cur.correct}, opts=${options.length})`)
    }
    cur = null
  }

  for (const line of lines) {
    const code = line.match(codeRe)
    if (code) {
      finalize()
      cur = {
        code: code[1],
        text: code[2].trim(),
        optsText: '',
        correct: null,
        explanation: '',
        difficulty: difficultyFromCode(code[1]),
      }
      continue
    }
    if (!cur) continue
    const expl = line.match(explRe)
    if (expl) {
      cur.correct = expl[1]
      cur.explanation = expl[2].trim()
      continue
    }
    if (line.startsWith('#')) {
      finalize()
      continue
    }
    if (line.trim() === '') continue
    cur.optsText += ' ' + line.trim()
  }
  finalize()
  return questions
}

// --- Parser de simulado ---
function parseSimulado(content) {
  const provaStart = content.indexOf('# 📝 PROVA')
  const gabStart = content.indexOf('# ✅ GABARITO')
  if (provaStart === -1 || gabStart === -1) {
    throw new Error('seções PROVA/GABARITO não encontradas')
  }
  const prova = content.slice(provaStart, gabStart)
  let gab = content.slice(gabStart)
  const interpIdx = gab.indexOf('# 📊')
  if (interpIdx !== -1) gab = gab.slice(0, interpIdx)

  // Gabarito: num -> { letter, explanation }
  const answers = new Map()
  for (const line of gab.split('\n')) {
    const m = line.match(/^(\d+)\.\s*\*\*([A-E])\*\*\s*[—–\-]*\s*(.*)$/)
    if (m) answers.set(Number(m[1]), { letter: m[2], explanation: m[3].trim() })
  }

  // Prova: questões + blocos de "Texto" + disciplina corrente
  const lines = prova.split('\n')
  const qRe = /^\*\*(\d+)\.\*\*\s*(.*)$/
  const headRe = /^##\s+(.+)$/
  const textoRe = /^\*\*Texto[^\n]*?\(quest(?:ão|ões)\s+(\d+)\s*(?:a|–|—|-)\s*(\d+)\)/i
  const textoRanges = []
  const questions = []
  let cur = null
  let module = null
  let pendingTexto = null // { from, to, lines: [] }

  const finalize = () => {
    if (!cur) return
    const options = parseOptions(cur.optsText)
    const ans = answers.get(cur.num)
    if (ans && options.length >= 2) {
      questions.push({
        num: cur.num,
        text: cur.text,
        options,
        correct: ans.letter,
        explanation: ans.explanation,
        module: cur.module,
      })
    } else {
      console.warn(`  ⚠️  questão ${cur.num} ignorada (ans=${!!ans}, opts=${options.length})`)
    }
    cur = null
  }
  const closeTexto = () => {
    if (pendingTexto && pendingTexto.lines.length) {
      textoRanges.push({
        from: pendingTexto.from,
        to: pendingTexto.to,
        text: pendingTexto.lines.join('\n').trim(),
      })
    }
    pendingTexto = null
  }

  for (const line of lines) {
    const head = line.match(headRe)
    if (head) {
      finalize()
      closeTexto()
      module = disciplineToModule(head[1])
      continue
    }
    const texto = line.match(textoRe)
    if (texto) {
      finalize()
      closeTexto()
      pendingTexto = { from: Number(texto[1]), to: Number(texto[2]), lines: [] }
      continue
    }
    const q = line.match(qRe)
    if (q) {
      finalize()
      closeTexto()
      cur = { num: Number(q[1]), text: q[2].trim(), optsText: '', module }
      continue
    }
    if (line.trim() === '') {
      // linha em branco encerra a coleta de opções da questão atual
      if (cur && cur.optsText) finalize()
      continue
    }
    if (pendingTexto) {
      pendingTexto.lines.push(line.replace(/^\*|\*$/g, '').trim())
      continue
    }
    if (cur) cur.optsText += ' ' + line.trim()
  }
  finalize()
  closeTexto()

  // Anexa o texto-base ao enunciado das questões cobertas
  for (const q of questions) {
    const r = textoRanges.find((tr) => q.num >= tr.from && q.num <= tr.to)
    if (r) q.text = `${r.text}\n\n${q.text}`
  }
  return questions
}

// --- Persistência ---
async function getModuleIds() {
  const { data, error } = await supabase.from('modules').select('id, slug')
  if (error) throw error
  return new Map((data ?? []).map((m) => [m.slug, m.id]))
}

const chunk = (arr, n) =>
  Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n))

// Faz upsert das questões e (re)cria as opções. Retorna map source_ref -> id.
async function upsertQuestions(rows) {
  const idBySource = new Map()
  for (const part of chunk(rows, 200)) {
    const { data, error } = await supabase
      .from('questions')
      .upsert(part, { onConflict: 'source_ref' })
      .select('id, source_ref')
    if (error) throw error
    for (const r of data) idBySource.set(r.source_ref, r.id)
  }
  return idBySource
}

async function replaceOptions(questionIds, optionRows) {
  for (const part of chunk(questionIds, 100)) {
    const { error } = await supabase.from('question_options').delete().in('question_id', part)
    if (error) throw error
  }
  for (const part of chunk(optionRows, 500)) {
    const { error } = await supabase.from('question_options').insert(part)
    if (error) throw error
  }
}

async function seedBanco(moduleIds) {
  let total = 0
  for (const { file, module } of BANCO_FILES) {
    const moduleId = moduleIds.get(module)
    if (!moduleId) {
      console.warn(`  ⚠️  módulo "${module}" não existe — rode scripts/seed.mjs antes. Pulando ${file}.`)
      continue
    }
    const raw = readFileSync(join(root, file), 'utf8')
    const parsed = parseBanco(raw)

    const qRows = parsed.map((q) => ({
      module_id: moduleId,
      question_text: q.text,
      question_type: 'multiple_choice',
      difficulty: q.difficulty,
      explanation: q.explanation || null,
      source_ref: q.code,
    }))
    const idBySource = await upsertQuestions(qRows)

    const ids = []
    const optionRows = []
    for (const q of parsed) {
      const qid = idBySource.get(q.code)
      if (!qid) continue
      ids.push(qid)
      q.options.forEach((o, i) =>
        optionRows.push({
          question_id: qid,
          text: o.text,
          is_correct: o.letter === q.correct,
          order_index: i,
        })
      )
    }
    await replaceOptions(ids, optionRows)
    total += parsed.length
    console.log(`✅ ${file}: ${parsed.length} questões`)
  }
  return total
}

async function seedSimulados(moduleIds) {
  let totalQ = 0
  for (const file of SIMULADO_FILES) {
    const raw = readFileSync(join(root, file), 'utf8')
    const titleLine = raw.split('\n').find((l) => l.startsWith('# ')) ?? file
    const title = titleLine.replace(/^#\s*/, '').trim()
    const code = file.match(/^(\d+[A-Z]?)/)[1] // ex.: 08A
    const slug = slugify(file.replace(/^\d+[A-Z]?-/, '').replace(/\.md$/, ''))
    const functionCode = functionFromFile(file)

    const parsed = parseSimulado(raw)

    // Exam
    const { data: examRow, error: examErr } = await supabase
      .from('exams')
      .upsert(
        {
          slug,
          title,
          description: null,
          exam_type: 'simulation',
          function_code: functionCode,
          total_questions: parsed.length,
          duration_minutes: 240,
          passing_score: 18,
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single()
    if (examErr) throw examErr
    const examId = examRow.id

    // Questões do simulado
    const qRows = parsed.map((q) => ({
      module_id: q.module ? moduleIds.get(q.module) ?? null : null,
      question_text: q.text,
      question_type: 'multiple_choice',
      difficulty: null,
      explanation: q.explanation || null,
      source_ref: `SIM-${code}-${String(q.num).padStart(3, '0')}`,
    }))
    const idBySource = await upsertQuestions(qRows)

    const ids = []
    const optionRows = []
    const linkRows = []
    for (const q of parsed) {
      const ref = `SIM-${code}-${String(q.num).padStart(3, '0')}`
      const qid = idBySource.get(ref)
      if (!qid) continue
      ids.push(qid)
      linkRows.push({ exam_id: examId, question_id: qid, order_index: q.num })
      q.options.forEach((o, i) =>
        optionRows.push({
          question_id: qid,
          text: o.text,
          is_correct: o.letter === q.correct,
          order_index: i,
        })
      )
    }
    await replaceOptions(ids, optionRows)

    // (Re)cria vínculos exam_questions
    const { error: delErr } = await supabase.from('exam_questions').delete().eq('exam_id', examId)
    if (delErr) throw delErr
    for (const part of chunk(linkRows, 500)) {
      const { error } = await supabase.from('exam_questions').insert(part)
      if (error) throw error
    }

    totalQ += parsed.length
    console.log(`✅ ${file}: simulado "${slug}" com ${parsed.length} questões`)
  }
  return totalQ
}

// --- Dry-run: só parseia e imprime estatísticas (não toca no banco) ---
function dryRun() {
  console.log('🔍 DRY-RUN (sem gravar no banco)\n\n📚 Bancos:')
  let totalB = 0
  for (const { file, module } of BANCO_FILES) {
    const parsed = parseBanco(readFileSync(join(root, file), 'utf8'))
    const bad = parsed.filter((q) => q.options.length !== 5).length
    const noCorrect = parsed.filter((q) => !q.options.some((o) => o.letter === q.correct)).length
    totalB += parsed.length
    console.log(
      `  ${file} [${module}]: ${parsed.length} q` +
        (bad ? ` · ⚠️ ${bad} sem 5 opções` : '') +
        (noCorrect ? ` · ⚠️ ${noCorrect} sem correta` : '')
    )
  }
  console.log('\n📝 Simulados:')
  let totalS = 0
  for (const file of SIMULADO_FILES) {
    const parsed = parseSimulado(readFileSync(join(root, file), 'utf8'))
    const bad = parsed.filter((q) => q.options.length !== 5).length
    const noCorrect = parsed.filter((q) => !q.options.some((o) => o.letter === q.correct)).length
    totalS += parsed.length
    console.log(
      `  ${file}: ${parsed.length} q` +
        (bad ? ` · ⚠️ ${bad} sem 5 opções` : '') +
        (noCorrect ? ` · ⚠️ ${noCorrect} sem correta` : '')
    )
  }
  console.log(`\nTotal: ${totalB} banco + ${totalS} simulado.`)
  // Amostra para inspeção visual
  const sample = parseBanco(readFileSync(join(root, BANCO_FILES[0].file), 'utf8'))[0]
  console.log('\n🔎 Amostra (banco):', JSON.stringify(sample, null, 2))
  const sampleSim = parseSimulado(readFileSync(join(root, '08A-SIMULADO-2-ACA.md'), 'utf8'))[0]
  console.log('\n🔎 Amostra (simulado, q1 c/ texto):', JSON.stringify(sampleSim, null, 2))
}

async function main() {
  if (process.argv.includes('--dry')) {
    dryRun()
    return
  }
  const moduleIds = await getModuleIds()
  if (moduleIds.size === 0) {
    console.error('❌ Nenhum módulo encontrado. Rode `node scripts/seed.mjs` primeiro.')
    process.exit(1)
  }

  console.log('\n📚 Bancos de questões:')
  const totalBanco = await seedBanco(moduleIds)

  console.log('\n📝 Simulados:')
  const totalSim = await seedSimulados(moduleIds)

  console.log(`\n🌱 Seed concluído: ${totalBanco} questões de banco + ${totalSim} de simulados.`)
}

main().catch((e) => {
  console.error('❌ Erro no seed:', e.message)
  process.exit(1)
})
