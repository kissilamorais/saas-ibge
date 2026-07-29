import { createAdminClient } from '@/lib/supabase/admin'
import type { Testimonial } from '@/types'

/**
 * Todos os depoimentos (ativos e inativos) para o painel admin, via
 * service_role — RLS só libera leitura pública dos ativos, então o admin
 * client é necessário para listar os inativos também.
 */
export async function getAllTestimonials(): Promise<Testimonial[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('testimonials')
    .select('*')
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  return (data ?? []) as Testimonial[]
}

export async function getTestimonialById(
  id: string
): Promise<Testimonial | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('testimonials')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  return (data as Testimonial | null) ?? null
}
