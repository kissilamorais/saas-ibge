import { NextResponse, type NextRequest } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { log, reportError } from '@/lib/observability/log'
import { createTrialSession } from '@/lib/trial-session'
import type { TrialLead } from '@/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Janela em que um novo cadastro com o mesmo e-mail reaproveita o lead. */
const REUSO_LEAD_MS = 2 * 60 * 60 * 1000 // 2h — mesma validade do cookie

/**
 * POST /api/trial/signup — entrada do funil do teste gratuito.
 *
 * NÃO cria conta no Supabase Auth. Criar uma conta confirmada a partir de um
 * e-mail apenas digitado era a VUL-001: dava para pré-registrar o endereço de
 * um futuro comprador e receber o acesso pago no lugar dele. Aqui o visitante
 * vira só um registro em `trial_leads` + um cookie httpOnly assinado; a conta
 * real nasce no pagamento (lib/onboarding/guest.ts).
 *
 * Como não há conta, também não há como este endpoint revelar quem já é aluno
 * — o e-mail nunca é consultado no Auth, e a resposta é sempre a mesma.
 */
export async function POST(request: NextRequest) {
  const rl = await rateLimit('trial-signup', clientIp(request), 5, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um instante e tente de novo.' },
      { status: 429 },
    )
  }

  const body = (await request.json().catch(() => null)) as {
    email?: unknown
    full_name?: unknown
    whatsapp?: unknown
  } | null

  const email =
    typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const fullName =
    typeof body?.full_name === 'string' ? body.full_name.trim() : ''
  // Opcional: o formulário do /teste não pede mais WhatsApp (o contato agora
  // acontece pelo botão da página de resultado). O campo continua aceito para
  // quem enviar — e, quando vem, ainda precisa ser um número plausível.
  const whatsapp =
    typeof body?.whatsapp === 'string' ? body.whatsapp.replace(/\D/g, '') : ''

  if (!EMAIL_RE.test(email) || fullName.length < 2) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }
  if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 11)) {
    return NextResponse.json(
      { error: 'Digite um WhatsApp válido com DDD.' },
      { status: 400 },
    )
  }

  const admin = createAdminClient()

  // Reaproveita um lead recente do mesmo e-mail (voltou para o /teste, perdeu
  // o cookie, trocou de aba) em vez de duplicar a linha no CRM. Passada a
  // janela, um novo cadastro é um novo lead — a pessoa refez o teste.
  const desde = new Date(Date.now() - REUSO_LEAD_MS).toISOString()
  const { data: recente } = await admin
    .from('trial_leads')
    .select('id, trial_cargo, target_function')
    .eq('email', email)
    .gte('created_at', desde)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let lead = recente as Pick<
    TrialLead,
    'id' | 'trial_cargo' | 'target_function'
  > | null

  if (lead) {
    // Nome/WhatsApp podem ter sido corrigidos na segunda tentativa. Sem número
    // no corpo, o update não toca a coluna: apagar um contato já gravado seria
    // perda de dado do CRM, não correção.
    const { error } = await admin
      .from('trial_leads')
      .update({ full_name: fullName, ...(whatsapp ? { whatsapp } : {}) })
      .eq('id', lead.id)
    if (error) {
      reportError('trial.signup.update_lead', error)
      return NextResponse.json(
        { error: 'Não foi possível iniciar seu teste. Tente de novo.' },
        { status: 500 },
      )
    }
  } else {
    const { data: criado, error } = await admin
      .from('trial_leads')
      .insert({ email, full_name: fullName, whatsapp: whatsapp || null })
      .select('id, trial_cargo, target_function')
      .single()

    if (error || !criado) {
      reportError(
        'trial.signup.insert_lead',
        error ?? new Error('insert retornou vazio'),
      )
      return NextResponse.json(
        { error: 'Não foi possível iniciar seu teste. Tente de novo.' },
        { status: 500 },
      )
    }
    lead = criado as Pick<TrialLead, 'id' | 'trial_cargo' | 'target_function'>
  }

  const response = NextResponse.json({ ok: true })
  await createTrialSession(
    {
      leadId: lead.id,
      email,
      fullName,
      ...(whatsapp ? { whatsapp } : {}),
      ...(lead.trial_cargo ? { cargo: lead.trial_cargo } : {}),
      ...(lead.target_function
        ? { targetFunction: lead.target_function }
        : {}),
    },
    response,
  )

  log.info('trial.signup.lead_created', { leadId: lead.id, reused: !!recente })
  return response
}
