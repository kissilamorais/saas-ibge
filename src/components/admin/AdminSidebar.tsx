'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeft,
  Gauge,
  Gift,
  LogOut,
  ShoppingCart,
  UserPlus,
} from 'lucide-react'

import { Logo } from '@/components/layout/Logo'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin', label: 'Visão geral', icon: Gauge, exact: true },
  { href: '/admin/leads', label: 'Leads', icon: UserPlus, exact: false },
  {
    href: '/admin/abandonos',
    label: 'Abandonos',
    icon: ShoppingCart,
    exact: false,
  },
  { href: '/admin/partners', label: 'Parceiros', icon: Gift, exact: false },
] as const

function useIsActive() {
  const pathname = usePathname()
  return (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)
}

function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className={cn(
          'inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          compact ? 'px-3 py-2' : 'w-full px-3 py-2'
        )}
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </form>
  )
}

export function AdminSidebar() {
  const isActive = useIsActive()

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card md:flex">
        <Link
          href="/admin"
          className="flex items-center gap-2 border-b px-6 py-5 text-foreground"
        >
          <Logo />
          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
            Admin
          </span>
        </Link>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                  active
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-1 border-t p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao app
          </Link>
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b bg-card px-4 py-3 md:hidden">
        <Link href="/admin" className="flex items-center gap-2 text-foreground">
          <Logo size="sm" />
          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
            Admin
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                className={cn(
                  'rounded-lg p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
            )
          })}
          <SignOutButton compact />
        </nav>
      </div>
    </>
  )
}
