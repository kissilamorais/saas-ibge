'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LogOut,
} from 'lucide-react'

import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/modules', label: 'Módulos', icon: BookOpen, exact: false },
  { href: '/dashboard/exams', label: 'Simulados', icon: FileCheck2, exact: false },
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
          'inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
          compact ? 'px-3 py-2' : 'w-full px-3 py-2'
        )}
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </form>
  )
}

export function Sidebar() {
  const isActive = useIsActive()

  return (
    <>
      {/* Desktop: sidebar fixa à esquerda */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-card md:flex">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 border-b px-6 py-5 font-bold tracking-tight"
        >
          <GraduationCap className="h-6 w-6 text-primary" />
          <span>ACA IBGE</span>
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
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-3">
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile: barra superior com navegação horizontal */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b bg-card px-4 py-3 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span>ACA IBGE</span>
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
                  'rounded-lg p-2 transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
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
