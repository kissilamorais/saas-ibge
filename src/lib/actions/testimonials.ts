'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { requireAdmin, getUser } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import type { TestimonialObjectionTag, TestimonialSource } from '@/types'

export type ActionState = { ok: boolean; message: string } | null

const VALID_SOURCES: TestimonialSource[] = ['whatsapp', 'email', 'platform']
const VALID_OBJECTIONS: TestimonialObjectionTag[] = [
  'quality',
  'price',
  'trust',
  'time',
  'specific',
  'simulator',
]
const CONTENT_MAX_LEN = 280

interface ParsedTestimonial {
  author_name: string
  author_cargo: string | null
  content: string
  source: TestimonialSource
  image_url: string | null
  objection_tag: TestimonialObjectionTag | null
  is_active: boolean
  display_order: number | null
}

type ParseResult = { error: string } | { value: ParsedTestimonial }

function parseTestimonialForm(formData: FormData): ParseResult {
  const author_name = String(formData.get('author_name') ?? '').trim()
  const author_cargo =
    String(formData.get('author_cargo') ?? '').trim() || null
  const content = String(formData.get('content') ?? '').trim()
  const sourceRaw = String(formData.get('source') ?? '')
  const image_url = String(formData.get('image_url') ?? '').trim() || null
  const objectionRaw = String(formData.get('objection_tag') ?? '')
  const is_active = formData.get('is_active') === 'on'
  const displayOrderRaw = String(formData.get('display_order') ?? '').trim()

  if (!author_name) return { error: 'Informe o nome do autor.' } as const
  if (!content) return { error: 'Informe o texto do depoimento.' } as const
  if (content.length > CONTENT_MAX_LEN) {
    return {
      error: `O depoimento deve ter no máximo ${CONTENT_MAX_LEN} caracteres.`,
    } as const
  }
  if (!VALID_SOURCES.includes(sourceRaw as TestimonialSource)) {
    return { error: 'Origem inválida.' } as const
  }
  const objection_tag = objectionRaw
    ? (objectionRaw as TestimonialObjectionTag)
    : null
  if (objection_tag && !VALID_OBJECTIONS.includes(objection_tag)) {
    return { error: 'Objeção inválida.' } as const
  }
  const display_order = displayOrderRaw ? Number(displayOrderRaw) : null
  if (display_order !== null && !Number.isInteger(display_order)) {
    return { error: 'Ordem de exibição deve ser um número inteiro.' } as const
  }

  return {
    value: {
      author_name,
      author_cargo,
      content,
      source: sourceRaw as TestimonialSource,
      image_url,
      objection_tag,
      is_active,
      display_order,
    },
  } as const
}

/** Cria um depoimento novo. Admin-only. */
export async function createTestimonial(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin()
  const user = await getUser()
  if (!user) return { ok: false, message: 'Autenticação perdida.' }

  // Rate limit: máximo 10 depoimentos/min.
  const rl = await rateLimit('admin-create-testimonial', user.id, 10, 60)
  if (!rl.success) return { ok: false, message: 'Tente novamente em alguns segundos.' }

  const parsed = parseTestimonialForm(formData)
  if ('error' in parsed) return { ok: false, message: parsed.error }

  const admin = createAdminClient()
  const { error } = await admin.from('testimonials').insert(parsed.value)

  if (error) {
    return { ok: false, message: 'Não foi possível salvar. Tente de novo.' }
  }

  revalidatePath('/admin/testimonials')
  revalidatePath('/')
  redirect('/admin/testimonials')
}

/** Atualiza um depoimento existente. Admin-only. */
export async function updateTestimonial(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireAdmin()
  const user = await getUser()
  if (!user) return { ok: false, message: 'Autenticação perdida.' }

  // Rate limit: máximo 20 updates de depoimento/min.
  const rl = await rateLimit('admin-update-testimonial', user.id, 20, 60)
  if (!rl.success) return { ok: false, message: 'Tente novamente em alguns segundos.' }

  const id = String(formData.get('id') ?? '')
  if (!id) return { ok: false, message: 'Depoimento inválido.' }

  const parsed = parseTestimonialForm(formData)
  if ('error' in parsed) return { ok: false, message: parsed.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('testimonials')
    .update({ ...parsed.value, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { ok: false, message: 'Não foi possível salvar. Tente de novo.' }
  }

  revalidatePath('/admin/testimonials')
  revalidatePath('/')
  redirect('/admin/testimonials')
}

/** Ativa/desativa um depoimento na landing. Admin-only. */
export async function toggleTestimonialActive(formData: FormData) {
  await requireAdmin()
  const user = await getUser()
  if (!user) return

  // Rate limit: máximo 30 toggle/min.
  const rl = await rateLimit('admin-toggle-testimonial', user.id, 30, 60)
  if (!rl.success) return

  const id = String(formData.get('id') ?? '')
  const nextActive = formData.get('next_active') === 'true'
  if (!id) return

  const admin = createAdminClient()
  await admin
    .from('testimonials')
    .update({ is_active: nextActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/admin/testimonials')
  revalidatePath('/')
}

/** Remove um depoimento. Admin-only. */
export async function deleteTestimonial(formData: FormData) {
  await requireAdmin()
  const user = await getUser()
  if (!user) return

  // Rate limit: máximo 10 deletions/min.
  const rl = await rateLimit('admin-delete-testimonial', user.id, 10, 60)
  if (!rl.success) return

  const id = String(formData.get('id') ?? '')
  if (!id) return

  const admin = createAdminClient()
  await admin.from('testimonials').delete().eq('id', id)

  revalidatePath('/admin/testimonials')
  revalidatePath('/')
}
