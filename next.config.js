/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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

  // Headers de segurança aplicados a todas as rotas. CSP fica de FORA de
  // propósito (exige allowlist testada de pixel/GA/InfinitePay/Supabase — será
  // uma tarefa separada com teste dedicado). HSTS com preload: só habilitar se
  // o domínio for sempre HTTPS (é o caso na Vercel).
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
        ],
      },
    ]
  },
}

module.exports = nextConfig
