const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: false, // Habilitado em desenvolvimento para testar instalação
  sw: 'sw.js',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
  buildExcludes: [/middleware-manifest\.json$/],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'api.dicebear.com',
      'www.gravatar.com',
      'secure.gravatar.com',
      '0.gravatar.com',
      '1.gravatar.com',
      '2.gravatar.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.gravatar.com',
        pathname: '/**',
      },
    ],
    // Permitir SVGs não otimizados para melhor compatibilidade
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = withPWA(nextConfig);

