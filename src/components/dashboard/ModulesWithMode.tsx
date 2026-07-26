'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  ProgressWidget,
  type ModuleProgress,
} from '@/components/dashboard/ProgressWidget'
import {
  StudyModeSelector,
  getStoredStudyMode,
  type StudyMode,
} from '@/components/dashboard/StudyModeSelector'

/** Módulo que concentra a revisão enxuta; o resto do edital fica no completo. */
const INTENSIVA_SLUG = 'revisao-intensiva'

interface ModulesWithModeProps {
  modules: ModuleProgress[]
}

export function ModulesWithMode({ modules }: ModulesWithModeProps) {
  // O 1º render precisa bater com o do servidor, então começa no padrão e só
  // depois adota a escolha salva no navegador.
  const [mode, setMode] = useState<StudyMode>('intensiva')

  useEffect(() => {
    setMode(getStoredStudyMode())
  }, [])

  const filtered = useMemo(
    () =>
      modules.filter((mod) =>
        mode === 'intensiva'
          ? mod.slug === INTENSIVA_SLUG
          : mod.slug !== INTENSIVA_SLUG
      ),
    [modules, mode]
  )

  return (
    <div className="space-y-4">
      <StudyModeSelector mode={mode} onModeChange={setMode} />
      <ProgressWidget modules={filtered} />
    </div>
  )
}
