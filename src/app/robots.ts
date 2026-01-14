import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/feed',
          '/ranking',
          '/posts/',
          '/perfil/',
          '/como-funciona',
          '/rede-social-investidor',
        ],
        disallow: [
          '/api/',
          '/auth/',
          '/checkout/',
          '/test/',
          '/admin/',
          '/_next/',
          '/bruno-method/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/feed',
          '/ranking',
          '/posts/',
          '/perfil/',
          '/como-funciona',
          '/rede-social-investidor',
        ],
        disallow: [
          '/api/',
          '/auth/',
          '/checkout/',
          '/test/',
          '/admin/',
          '/_next/',
          '/bruno-method/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

