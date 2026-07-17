'use client'

import Script from 'next/script'

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID

// Mesma regra do Meta Pixel: só dispara em produção E com o ID configurado.
// Em dev é no-op, então nenhum hit falso é enviado durante o desenvolvimento.
const GA4_ENABLED = process.env.NODE_ENV === 'production' && Boolean(GA4_ID)

/**
 * Google Analytics 4 (gtag.js). Segue o mesmo padrão do MetaPixel:
 * - next/script afterInteractive: carrega depois que a página fica
 *   interativa, sem competir com o LCP.
 * - O snippet padrão inicializa o dataLayer e envia o primeiro page_view no
 *   `config`. Navegações client-side (App Router) são cobertas pelo
 *   "enhanced measurement" do GA4 (page_view via eventos de histórico, ligado
 *   por padrão) — por isso não disparamos page_view manual, para não duplicar.
 */
export function GoogleAnalytics() {
  if (!GA4_ENABLED) return null

  return (
    <>
      <Script
        id="ga4-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA4_ID}');`}
      </Script>
    </>
  )
}
