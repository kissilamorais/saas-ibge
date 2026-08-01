/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify removido no Next 15: a minificação por SWC virou o único caminho,
  // a flag deixou de ser reconhecida (o build avisava "Unrecognized key").
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.stripe.com',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // NEXT_PUBLIC_APP_URL é lido direto de process.env (vem do .env.local / Vercel).
  // Não redefinimos aqui para não mascarar a env configurada no ambiente; quando
  // ausente, o código usa o origin da requisição como fallback.

  // Headers de segurança aplicados a todas as rotas. HSTS com preload: só
  // habilitar se o domínio for sempre HTTPS (é o caso na Vercel).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Report-Only (auditoria 31/07/2026, item 21 do Bloco 3): só LOGA
          // violação no console do navegador, nunca bloqueia. Allowlist
          // cobre os hosts que o site de fato chama: Supabase (dados/storage),
          // Meta Pixel + GA4 (script-src/connect-src/img-src), InfinitePay
          // (checkout). `'unsafe-inline'` em script-src é exigido pelos
          // snippets inline do Pixel/GA4 (ver MetaPixel.tsx/GoogleAnalytics.tsx)
          // — eliminá-lo exigiria migrar para nonce. Depois de 1-2 semanas
          // sem violação real no console, promover para
          // `Content-Security-Policy` (enforce).
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://connect.facebook.net https://www.googletagmanager.com",
              "connect-src 'self' https://*.supabase.co https://graph.facebook.com https://www.google-analytics.com https://api.checkout.infinitepay.io",
              "img-src 'self' data: https://*.supabase.co https://www.facebook.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
