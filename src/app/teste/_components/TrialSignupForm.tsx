'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Phone, User, Loader2, ArrowRight } from 'lucide-react'

import { trackPixel } from '@/lib/analytics/meta-pixel'
import { createClient } from '@/lib/supabase/client'
import { CTA_PRIMARY_ON_LIGHT } from '@/components/landing/brand'

const FIELD_CLASS =
  'h-11 w-full rounded-lg border border-[#0B3D2E]/15 bg-white px-4 text-sm text-[#0B3D2E] shadow-sm placeholder:text-[#5F6B66] focus:border-[#D4A017] focus:outline-none focus:ring-2 focus:ring-[#D4A017]/30 disabled:opacity-60'
const LABEL_CLASS = 'block text-sm font-medium text-[#0B3D2E]'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Só os dígitos — é o que o wa.me consome no painel do admin. */
function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/**
 * O Supabase não expõe um código estável para "e-mail já cadastrado": a
 * mensagem varia entre versões. Casamos por trecho para detectar o caso.
 */
function pareceEmailJaCadastrado(mensagem: string): boolean {
  const m = mensagem.toLowerCase()
  return (
    m.includes('already registered') ||
    m.includes('already been registered') ||
    m.includes('user already exists')
  )
}

export function TrialSignupForm() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [otpEnviado, setOtpEnviado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    const emailNormalizado = email.trim().toLowerCase()
    const digitos = apenasDigitos(whatsapp)

    if (nome.trim().length < 2) {
      setErro('Digite seu nome completo.')
      return
    }
    if (!EMAIL_RE.test(emailNormalizado)) {
      setErro('Digite um e-mail válido.')
      return
    }
    if (digitos.length < 10 || digitos.length > 11) {
      setErro('Digite um WhatsApp válido com DDD.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      // Tenta signUp — com "Confirm email" desligado no Supabase, dispara
      // e-mail de definição de senha automaticamente (sem password requerida).
      // O tipo exige password, mas passamos vazio — o GoTrue ignora.
      const { data, error } = await (
        supabase.auth.signUp as (opts: {
          email: string
          password?: string
          options?: { data?: { [key: string]: string } }
        }) => ReturnType<typeof supabase.auth.signUp>
      )({
        email: emailNormalizado,
        password: '', // Ignorado quando "Confirm email" está desligado
        options: { data: { full_name: nome.trim(), whatsapp: digitos } },
      })

      if (error) {
        if (!pareceEmailJaCadastrado(error.message)) throw error

        // E-mail já existe — envia magic link (OTP)
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: emailNormalizado,
          options: {
            shouldCreateUser: false,
          },
        })

        if (otpError) {
          throw new Error(
            'Esse e-mail já tem conta no Aprovus. Enviamos um link para você entrar.',
          )
        }

        setOtpEnviado(true)
        setErro(null)
        setLoading(false)
        return
      }

      trackPixel('Lead')

      // signUp criou a conta. Agora marca como trial
      const userId = data.user?.id
      if (userId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ whatsapp: digitos, is_trial: true })
          .eq('id', userId)

        if (profileError) {
          console.error('Falha ao marcar lead do teste:', profileError.message)
        }
      }

      // Sem confirmação de e-mail, a sessão já vem no signUp
      if (data.session) {
        router.push('/teste/cargo')
        router.refresh()
      } else {
        // Com confirmação ligada: direcionar pro e-mail
        setOtpEnviado(true)
      }
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : 'Não foi possível criar sua conta. Tente de novo.',
      )
      setLoading(false)
    }
  }

  if (otpEnviado) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-lg bg-[#0B3D2E]/[0.04] px-4 py-3">
          <p className="text-sm font-medium text-[#0B3D2E]">
            Enviamos um link para o seu e-mail
          </p>
          <p className="mt-1 text-xs text-[#0B3D2E]/70">
            Clique nele para confirmar sua conta e começar o diagnóstico.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOtpEnviado(false)}
          className="text-sm text-[#9A6E12] underline hover:text-[#0B3D2E]"
        >
          Voltar
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label className={LABEL_CLASS} htmlFor="nome">
          Nome completo
        </label>
        <div className="relative flex items-center">
          <User className="absolute left-3 h-4 w-4 text-[#0B3D2E]/40" strokeWidth={1.75} />
          <input
            id="nome"
            type="text"
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            disabled={loading}
            className={`${FIELD_CLASS} pl-10`}
            placeholder="Maria Silva"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS} htmlFor="email">
          E-mail
        </label>
        <div className="relative flex items-center">
          <Mail className="absolute left-3 h-4 w-4 text-[#0B3D2E]/40" strokeWidth={1.75} />
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className={`${FIELD_CLASS} pl-10`}
            placeholder="voce@email.com"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS} htmlFor="whatsapp">
          WhatsApp
        </label>
        <div className="relative flex items-center">
          <Phone className="absolute left-3 h-4 w-4 text-[#0B3D2E]/40" strokeWidth={1.75} />
          <input
            id="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            disabled={loading}
            className={`${FIELD_CLASS} pl-10`}
            placeholder="(21) 99999-9999"
          />
        </div>
      </div>

      {erro && (
        <p
          role="alert"
          className="rounded-lg bg-[#B3261E]/10 px-3 py-2 text-sm text-[#B3261E]"
        >
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`${CTA_PRIMARY_ON_LIGHT} w-full gap-2 disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Começar o diagnóstico
        {!loading && <ArrowRight className="h-4 w-4" strokeWidth={2.5} />}
      </button>

      <div className="border-t border-[#0B3D2E]/10 pt-4 text-center">
        <p className="text-xs text-[#0B3D2E]/55">
          Já tem conta?{' '}
          <Link href="/auth/login" className="font-medium underline hover:text-[#0B3D2E]">
            Entrar aqui
          </Link>
        </p>
      </div>
    </form>
  )
}
