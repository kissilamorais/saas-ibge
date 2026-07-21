'use client'

import { useEffect, useState } from 'react'

interface CountdownTimerProps {
  /**
   * Instante-alvo em ISO 8601. Deve trazer o offset (ex.: "-03:00") para o
   * alvo ficar inequívoco em America/Sao_Paulo, independente do fuso de quem vê.
   */
  targetDate: string
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

/**
 * Contador regressivo — fundo escuro, números grandes em verde. Sem dependência
 * externa (só Date + setInterval). Ao zerar, mostra "Preço atualizado".
 *
 * Hidratação segura: o servidor não sabe a hora do cliente, então antes de
 * montar renderizamos placeholders ("--") com o mesmo layout, evitando mismatch
 * e pulo de layout. A contagem começa no efeito, no cliente.
 */
export function CountdownTimer({ targetDate, className }: CountdownTimerProps) {
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
          'inline-flex items-center justify-center rounded-xl bg-[#0B3D2E] px-6 py-4 text-lg font-semibold text-[#00d668] ' +
          (className ?? '')
        }
      >
        Preço atualizado
      </div>
    )
  }

  const units: { label: string; value: number | null }[] = [
    { label: 'dias', value: remaining?.days ?? null },
    { label: 'horas', value: remaining?.hours ?? null },
    { label: 'min', value: remaining?.minutes ?? null },
    { label: 'seg', value: remaining?.seconds ?? null },
  ]

  return (
    <div
      className={
        'inline-flex items-stretch gap-2 rounded-xl bg-[#0B3D2E] p-3 shadow-lg sm:gap-3 sm:p-4 ' +
        (className ?? '')
      }
    >
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-center gap-2 sm:gap-3">
          <div className="flex min-w-[3.25rem] flex-col items-center sm:min-w-[4rem]">
            <span className="font-display text-3xl font-bold tabular-nums text-[#00d668] sm:text-4xl">
              {value === null ? '--' : pad(value)}
            </span>
            <span className="mt-1 text-[0.65rem] font-medium uppercase tracking-widest text-white/60">
              {label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="pb-4 text-2xl font-bold text-[#00d668]/40 sm:text-3xl">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
