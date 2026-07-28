import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/stripe/activate', () => ({
  activateUserAccess: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))

import { onboardGuestByEmail } from './guest'

/**
 * Fake mínimo do client admin: só o que `onboardGuestByEmail` toca.
 * `profileId` = id devolvido pela busca em profiles (null → conta não existe).
 * `confirmedAt` = email_confirmed_at do usuário no Auth (null → ninguém provou
 * posse do e-mail; é a conta "ocupada" pelo funil do teste gratuito).
 */
function fakeAdmin(opts: {
  profileId: string | null
  confirmedAt?: string | null
}) {
  const calls = {
    createUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'novo-user' } },
      error: null,
    }),
    getUserById: vi.fn().mockResolvedValue({
      data: { user: { id: opts.profileId, email_confirmed_at: opts.confirmedAt ?? null } },
      error: null,
    }),
    updateUserById: vi.fn().mockResolvedValue({ data: {}, error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
  }

  const admin = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: opts.profileId ? { id: opts.profileId } : null,
          }),
        }),
      }),
    }),
    auth: {
      admin: {
        createUser: calls.createUser,
        getUserById: calls.getUserById,
        updateUserById: calls.updateUserById,
      },
      resetPasswordForEmail: calls.resetPasswordForEmail,
    },
  }

  return { admin, calls }
}

type AdminArg = Parameters<typeof onboardGuestByEmail>[0]

/** O fake cobre só a superfície usada pela função — o cast é intencional. */
const asAdminClient = (fake: unknown) => fake as AdminArg

const opts = { appUrl: 'https://app.test', where: 'test' }

describe('onboardGuestByEmail — reclaim de conta não verificada', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reclama a conta quando o e-mail nunca foi confirmado (VUL-001)', async () => {
    const { admin, calls } = fakeAdmin({
      profileId: 'ocupante',
      confirmedAt: null,
    })

    const res = await onboardGuestByEmail(
      asAdminClient(admin),
      'comprador@example.com',
      opts
    )

    // Senha rotacionada → o ocupante perde a credencial e as sessões ativas.
    expect(calls.updateUserById).toHaveBeenCalledTimes(1)
    const [userId, payload] = calls.updateUserById.mock.calls[0]
    expect(userId).toBe('ocupante')
    expect(typeof payload.password).toBe('string')
    expect(payload.password.length).toBeGreaterThan(30)
    expect(payload.email_confirm).toBe(true)

    // E o comprador real recebe o e-mail de definir senha.
    expect(calls.resetPasswordForEmail).toHaveBeenCalledTimes(1)
    expect(res).toEqual({ userId: 'ocupante', isNewUser: true })
  })

  it('não mexe na conta de quem já confirmou o e-mail', async () => {
    const { admin, calls } = fakeAdmin({
      profileId: 'aluno',
      confirmedAt: '2026-01-01T00:00:00Z',
    })

    const res = await onboardGuestByEmail(
      asAdminClient(admin),
      'aluno@example.com',
      opts
    )

    expect(calls.updateUserById).not.toHaveBeenCalled()
    expect(calls.resetPasswordForEmail).not.toHaveBeenCalled()
    expect(res).toEqual({ userId: 'aluno', isNewUser: false })
  })

  it('conta nova segue o caminho normal, sem passar pelo reclaim', async () => {
    const { admin, calls } = fakeAdmin({ profileId: null })

    const res = await onboardGuestByEmail(
      asAdminClient(admin),
      'novo@example.com',
      opts
    )

    expect(calls.createUser).toHaveBeenCalledTimes(1)
    expect(calls.getUserById).not.toHaveBeenCalled()
    expect(calls.updateUserById).not.toHaveBeenCalled()
    expect(calls.resetPasswordForEmail).toHaveBeenCalledTimes(1)
    expect(res).toEqual({ userId: 'novo-user', isNewUser: true })
  })
})
