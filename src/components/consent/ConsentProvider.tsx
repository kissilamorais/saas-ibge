'use client'

import { createContext, useContext, useEffect, useState } from 'react'

import {
  CONSENT_VERSION,
  readConsentCookie,
  writeConsentCookie,
  type ConsentChoices,
  type ConsentState,
} from '@/lib/consent'

interface ConsentContextValue {
  /** null = ainda não decidiu (banner deve aparecer) ou ainda lendo o cookie no 1º render. */
  consent: ConsentState | null
  /** false só no 1º render (evita flash do banner antes de ler o cookie salvo). */
  ready: boolean
  setConsent: (choices: ConsentChoices) => void
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<ConsentState | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setConsentState(readConsentCookie())
    setReady(true)
  }, [])

  const setConsent = (choices: ConsentChoices) => {
    writeConsentCookie(choices)
    setConsentState({ ...choices, version: CONSENT_VERSION })
  }

  return (
    <ConsentContext.Provider value={{ consent, ready, setConsent }}>
      {children}
    </ConsentContext.Provider>
  )
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext)
  if (!ctx) {
    throw new Error('useConsent precisa estar dentro de <ConsentProvider>')
  }
  return ctx
}
