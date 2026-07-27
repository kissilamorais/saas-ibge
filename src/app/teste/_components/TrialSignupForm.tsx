'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

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
 * mensagem varia entre versões do GoTrue. Casamos por trecho, e o fallback é
 * benigno — tentar o login com as credenciais que a pessoa acabou de digitar.
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
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

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
    // 10 dígitos (fixo com DDD) a 11 (celular com DDD).
    if (digitos.length < 10 || digitos.length > 11) {
      setErro('Digite um WhatsApp válido com DDD.')
      return
    }
    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signUp({
        email: emailNormalizado,
        password: senha,
        options: { data: { full_name: nome.trim(), whatsapp: digitos } },
      })

      let sessao = data?.session ?? null

      if (error) {
        if (!pareceEmailJaCadastrado(error.message)) throw error
        // Já tem conta → entra com a senha informada.
        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: emailNormalizado,
            password: senha,
          })
        if (loginError) {
          throw new Error(
            'Esse e-mail já tem conta no Aprovus, mas a senha não confere. Use a senha da sua conta ou recupere o acesso.',
          )
        }
        sessao = loginData.session
      } else {
        trackPixel('Lead')
      }

      // signUp sem sessão = confirmação de e-mail ligada no projeto Supabase.
      // Tentamos entrar assim mesmo; se o GoTrue exigir a confirmação, o erro
      // vira uma instrução clara em vez de um beco sem saída.
      if (!sessao) {
        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: emailNormalizado,
            password: senha,
          })
        if (loginError || !loginData.session) {
          setErro(
            'Conta criada! Confirme o e-mail que acabamos de enviar para liberar o diagnóstico.',
          )
          setLoading(false)
          return
        }
        sessao = loginData.session
      }

      // Marca o lead. Falha aqui não interrompe o funil — o diagnóstico não
      // depende destas colunas, e o WhatsApp já foi para o user_metadata.
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ whatsapp: digitos, is_trial: true })
        .eq('id', sessao.user.id)

      if (profileError) {
        console.error('Falha ao marcar lead do teste:', profileError.message)
      }

      router.push('/teste/cargo')
      router.refresh()
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : 'Não foi possível criar sua conta. Tente de novo.',
      )
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label className={LABEL_CLASS} htmlFor="nome">
          Nome completo
        </label>
        <input
          id="nome"
          type="text"
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          disabled={loading}
          className={FIELD_CLASS}
          placeholder="Maria Silva"
        />
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS} htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className={FIELD_CLASS}
          placeholder="voce@email.com"
        />
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS} htmlFor="whatsapp">
          WhatsApp
        </label>
        <input
          id="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          disabled={loading}
          className={FIELD_CLASS}
          placeholder="(21) 99999-9999"
        />
      </div>

      <div className="space-y-1.5">
        <label className={LABEL_CLASS} htmlFor="senha">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          disabled={loading}
          className={FIELD_CLASS}
          placeholder="Mínimo 6 caracteres"
        />
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
        className={`${CTA_PRIMARY_ON_LIGHT} w-full disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Começar o diagnóstico
      </button>

      <p className="text-center text-xs text-[#0B3D2E]/55">
        Leva 5 minutos. Sem cartão de crédito.{' '}
        <Link href="/auth/login" className="underline hover:text-[#0B3D2E]">
          Já tem conta?
        </Link>
      </p>
    </form>
  )
}
