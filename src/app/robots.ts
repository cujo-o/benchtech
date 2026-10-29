import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/feed',
          '/products',
          '/products/*',
          '/sellers',
          '/sellers/*',
          '/requests/new',
          '/compare',
          '/help',
          '/privacy',
          '/terms',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/seller',
          '/seller/*',
          '/orders',
          '/orders/*',
          '/wallet',
          '/saved',
          '/api/*',
          '/auth/*',
        ],
      },
    ],
    sitemap: 'https://shopbenchtech.com/sitemap.xml',
  }
}