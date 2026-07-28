import { SignJWT } from 'jose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { getTrialSessionFromRequest, type TrialSessionData } from './trial-session'

/**
 * O cookie do funil é a ÚNICA credencial do visitante do teste gratuito: é ele
 * que diz "este é o lead X" para /api/trial/* e para a página de resultado.
 * Se a verificação aceitasse um token forjado, qualquer um leria o diagnóstico
 * (e o e-mail) de outro lead. Estes testes cobrem exatamente essa fronteira.
 */

const SEGREDO = 'segredo-de-teste-com-mais-de-32-caracteres!!'
const OUTRO_SEGREDO = 'outro-segredo-de-teste-com-32-caracteres!!'

const dados: TrialSessionData = {
  leadId: '11111111-1111-4111-8111-111111111111',
  email: 'lead@example.com',
  fullName: 'Maria Silva',
  whatsapp: '21999998888',
  cargo: 'ACA',
}

/** Assina um token como o helper faz, mas com segredo/expiração à escolha. */
async function assinar(
  payload: Record<string, unknown>,
  segredo: string,
  exp = '2h',
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(exp)
    .setIssuedAt()
    .sign(new TextEncoder().encode(segredo))
}

/** NextRequest só é tocado por `.cookies.get()` — este stub basta. */
function requestComCookie(token: string | null) {
  return {
    cookies: { get: () => (token === null ? undefined : { value: token }) },
  } as unknown as Parameters<typeof getTrialSessionFromRequest>[0]
}

describe('getTrialSessionFromRequest', () => {
  const anterior = process.env.TRIAL_SESSION_SECRET
  beforeAll(() => {
    process.env.TRIAL_SESSION_SECRET = SEGREDO
  })
  afterAll(() => {
    process.env.TRIAL_SESSION_SECRET = anterior
  })

  it('devolve o payload de um token válido', async () => {
    const token = await assinar({ ...dados }, SEGREDO)
    const session = await getTrialSessionFromRequest(requestComCookie(token))

    expect(session?.leadId).toBe(dados.leadId)
    expect(session?.email).toBe(dados.email)
    expect(session?.cargo).toBe('ACA')
  })

  it('recusa token assinado com outro segredo', async () => {
    const token = await assinar({ ...dados }, OUTRO_SEGREDO)
    expect(await getTrialSessionFromRequest(requestComCookie(token))).toBeNull()
  })

  it('recusa token adulterado (troca de leadId no payload)', async () => {
    const token = await assinar({ ...dados }, SEGREDO)
    const [header, payload, assinatura] = token.split('.')
    const adulterado = Buffer.from(
      JSON.stringify({ ...dados, leadId: '22222222-2222-4222-8222-222222222222' }),
    ).toString('base64url')

    expect(adulterado).not.toBe(payload)
    expect(
      await getTrialSessionFromRequest(
        requestComCookie(`${header}.${adulterado}.${assinatura}`),
      ),
    ).toBeNull()
  })

  it('recusa token expirado', async () => {
    const token = await assinar({ ...dados }, SEGREDO, '-1s')
    expect(await getTrialSessionFromRequest(requestComCookie(token))).toBeNull()
  })

  it('devolve null sem cookie', async () => {
    expect(await getTrialSessionFromRequest(requestComCookie(null))).toBeNull()
  })
})
