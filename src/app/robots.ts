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
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/seller',
          '/seller/*',
          '/orders',
          '/orders/*',
          '/messages',
          '/messages/*',
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