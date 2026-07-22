'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  /**
   * Instante-alvo em ISO 8601. Deve trazer o offset (ex.: "-03:00") para o
   * alvo ficar inequívoco em America/Sao_Paulo, independente do fuso de quem vê.
   */
  targetDate: string
  /** Presença visual: compacto (oferta), padrão (hero) ou máximo (urgência). */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface Remaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * Diferença até o alvo, decomposta em d/h/m/s. `null` quando já passou.
 * Como o alvo é um instante absoluto e o resultado é uma DURAÇÃO, o cálculo
 * independe do fuso do dispositivo — o offset no targetDate já ancora tudo em SP.
 */
function getRemaining(target: number): Remaining | null {
  const diff = target - Date.now()
  if (diff <= 0) return null
  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Escala tipográfica por tamanho — número, rótulo, célula e espaçamento. */
const SIZES = {
  sm: {
    cell: 'min-w-[3.5rem] px-2.5 py-2.5 sm:min-w-[4rem]',
    num: 'text-2xl sm:text-3xl',
    label: 'text-[0.6rem]',
    gap: 'gap-2',
  },
  md: {
    cell: 'min-w-[4.25rem] px-3 py-3 sm:min-w-[5.25rem] sm:px-4 sm:py-4',
    num: 'text-3xl sm:text-5xl',
    label: 'text-[0.65rem] sm:text-xs',
    gap: 'gap-2 sm:gap-3',
  },
  lg: {
    cell: 'min-w-[4.75rem] px-3 py-3.5 sm:min-w-[6.5rem] sm:px-5 sm:py-5',
    num: 'text-4xl sm:text-6xl',
    label: 'text-[0.65rem] sm:text-sm',
    gap: 'gap-2.5 sm:gap-4',
  },
} as const

/**
 * Contador regressivo — quatro blocos "esculpidos" sobre o petróleo, cada
 * número grande em card próprio (fundo mais escuro), rótulo pequeno embaixo.
 * Sem dependência externa (só Date + setInterval). Ao zerar, mostra a mensagem.
 *
 * Hidratação segura: o servidor não sabe a hora do cliente, então antes de
 * montar renderizamos placeholders ("--") com o mesmo layout, evitando mismatch
 * e pulo de layout. A contagem começa no efeito, no cliente.
 */
export function CountdownTimer({
  targetDate,
  size = 'md',
  className,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<Remaining | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const target = new Date(targetDate).getTime()

    const tick = () => setRemaining(getRemaining(target))
    tick() // primeira leitura imediata, sem esperar 1s
    setMounted(true)

    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [targetDate])

  // Já passou do alvo.
  if (mounted && remaining === null) {
    return (
      <div
        className={
          'inline-flex items-center justify-center rounded-xl border border-[#D4A017]/30 bg-[#072A20] px-6 py-4 text-lg font-semibold text-[#D4A017] ' +
          (className ?? '')
        }
      >
        Preço atualizado
      </div>
    )
  }

  const s = SIZES[size]
  const units: { label: string; value: number | null }[] = [
    { label: 'dias', value: remaining?.days ?? null },
    { label: 'horas', value: remaining?.hours ?? null },
    { label: 'min', value: remaining?.minutes ?? null },
    { label: 'seg', value: remaining?.seconds ?? null },
  ]

  return (
    <div className={'inline-flex items-stretch ' + s.gap + ' ' + (className ?? '')}>
      {units.map(({ label, value }) => (
        <div
          key={label}
          className={
            'flex flex-col items-center rounded-xl border border-white/10 bg-[#072A20] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ' +
            s.cell
          }
        >
          <span
            className={
              'font-serif font-semibold leading-none tabular-nums text-[#D4A017] ' +
              s.num
            }
          >
            {value === null ? '--' : pad(value)}
          </span>
          <span
            className={
              'mt-1.5 font-medium uppercase tracking-widest text-white/55 ' +
              s.label
            }
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
