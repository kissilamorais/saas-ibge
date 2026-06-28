'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

import { META_PIXEL_ID, PIXEL_ENABLED } from '@/lib/analytics/meta-pixel'

/**
 * Base do Meta Pixel + PageView.
 * - next/script afterInteractive: carrega depois que a página fica
 *   interativa, sem competir com o LCP.
 * - O snippet padrão já dispara o 1º PageView no init; o efeito abaixo
 *   cobre as navegações client-side (App Router não dá full reload).
 */
export function MetaPixel() {
  const pathname = usePathname()
  const isFirstLoad = useRef(true)

  useEffect(() => {
    if (!PIXEL_ENABLED) return
    if (isFirstLoad.current) {
      // O init script já contou o primeiro PageView — não duplicar.
      isFirstLoad.current = false
      return
    }
    window.fbq?.('track', 'PageView')
  }, [pathname])

  if (!PIXEL_ENABLED) return null

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
