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
}

module.exports = nextConfig
