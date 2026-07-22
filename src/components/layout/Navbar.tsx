'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { Logo } from '@/components/layout/Logo'

/**
 * Navbar pública (landing). Transparente sobre o hero escuro no topo e vira
 * sólida (off-white + blur) ao rolar — some a "faixa clara" sobre o petróleo.
 * Para as rotas de estudo usamos a Sidebar.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll() // estado correto se a página abrir já rolada
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={
        'fixed inset-x-0 top-0 z-40 border-b transition-colors duration-300 ' +
        (scrolled
          ? 'border-border bg-background/80 backdrop-blur'
          : 'border-transparent bg-transparent')
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className={scrolled ? 'text-foreground' : 'text-[#0B3D2E]'}
        >
          <Logo iconClassName={scrolled ? undefined : 'text-[#D4A017]'} />
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/auth/login"
            className={
              'rounded-lg px-4 py-2 font-medium transition-colors ' +
              (scrolled
                ? 'text-foreground hover:bg-accent'
                : 'text-[#0B3D2E]/90 hover:bg-[#0B3D2E]/5')
            }
          >
            Entrar
          </Link>
          <Link
            href="/auth/signup"
            className={
              'rounded-lg px-4 py-2 font-semibold text-[#0B3D2E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017] focus-visible:ring-offset-2 ' +
              (scrolled
                ? 'bg-[#D4A017] hover:bg-[#E3B341] focus-visible:ring-offset-background'
                : 'bg-[#D4A017] hover:bg-[#E3B341] focus-visible:ring-offset-[#E8EFEC]')
            }
          >
            Começar agora
          </Link>
        </nav>
      </div>
    </header>
  )
}
