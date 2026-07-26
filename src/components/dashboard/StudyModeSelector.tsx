'use client'

import { BookOpen, Zap, type LucideIcon } from 'lucide-react'

import { Card } from '@/components/ui/card'

export type StudyMode = 'intensiva' | 'completo'

const STORAGE_KEY = 'aprovus:study-mode'
const DEFAULT_MODE: StudyMode = 'intensiva'

/**
 * Modo escolhido, lido do navegador. É preferência de leitura (não dado de
 * negócio), por isso mora no localStorage e não no profile. Em SSR ou com
 * valor desconhecido, cai no padrão.
 */
export function getStoredStudyMode(): StudyMode {
  if (typeof window === 'undefined') return DEFAULT_MODE

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'intensiva' || stored === 'completo' ? stored : DEFAULT_MODE
}

function storeStudyMode(mode: StudyMode) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, mode)
}

const MODES: {
  mode: StudyMode
  icon: LucideIcon
  title: string
  description: string
}[] = [
  {
    mode: 'intensiva',
    icon: Zap,
    title: 'Revisão Intensiva',
    description: 'O essencial que a IBFC cobra — foco no que cai',
  },
  {
    mode: 'completo',
    icon: BookOpen,
    title: 'Conteúdo Completo',
    description: 'Todo o edital, sem filtro',
  },
]

interface StudyModeSelectorProps {
  mode: StudyMode
  onModeChange: (mode: StudyMode) => void
}

export function StudyModeSelector({
  mode,
  onModeChange,
}: StudyModeSelectorProps) {
  function select(next: StudyMode) {
    storeStudyMode(next)
    onModeChange(next)
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {MODES.map((option) => {
        const Icon = option.icon
        const isActive = option.mode === mode

        return (
          <button
            key={option.mode}
            type="button"
            aria-pressed={isActive}
            onClick={() => select(option.mode)}
            className="rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card
              className={
                isActive
                  ? 'h-full p-4 ring-1 ring-primary bg-primary/5 transition-colors'
                  : 'h-full p-4 border-border hover:bg-muted/50 transition-colors'
              }
            >
              <div className="flex items-start gap-3">
                <Icon
                  className={
                    isActive
                      ? 'mt-0.5 h-5 w-5 shrink-0 text-primary'
                      : 'mt-0.5 h-5 w-5 shrink-0 text-muted-foreground'
                  }
                />
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{option.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            </Card>
          </button>
        )
      })}
    </div>
  )
}
