'use client'

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * Copia um link para a área de transferência com feedback visual curto.
 * Usado no painel de abandonos: o disparo do contato é manual nesta fase.
 */
export function CopyLinkButton({
  url,
  label = 'Copiar link',
}: {
  url: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(t)
  }, [copied])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // Clipboard bloqueado (contexto não-seguro / permissão negada):
      // seleciona o texto num campo temporário como último recurso.
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(ok)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      aria-label={`${label}: ${url}`}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" aria-hidden />
          Copiado
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" aria-hidden />
          {label}
        </>
      )}
    </Button>
  )
}
