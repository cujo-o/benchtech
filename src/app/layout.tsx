import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://shopbenchtech.com'),
  title: {
    default: 'BenchTech | Verified Tech Marketplace in Abuja',
    template: '%s | BenchTech Abuja',
  },
  description:
    'Buy and sell verified smartphones, laptops, gaming rigs, and electronics in Abuja. Physical store inspection at Banex Plaza, Emab Plaza, and Wuse 2.',
  keywords: [
    'Tech marketplace Abuja',
    'Buy phones in Banex',
    'Laptops in Abuja',
    'Emab plaza phones',
    'UK used laptops Abuja',
    'iPhone prices Abuja',
    'Fairly used gadgets Abuja',
    'BenchTech',
  ],
  authors: [{ name: 'BenchTech Technologies' }],
  creator: 'BenchTech',
  publisher: 'BenchTech',
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'BenchTech | Verified Tech Marketplace in Abuja',
    description:
      'Buy and sell verified gadgets in Abuja with safe in-person inspection at Banex & Wuse plazas.',
    url: 'https://shopbenchtech.com',
    siteName: 'BenchTech Abuja',
    locale: 'en_NG',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BenchTech Abuja Tech Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BenchTech | Verified Tech Marketplace in Abuja',
    description:
      'Inspect physical laptops, phones, and hardware in Abuja before paying.',
    images: ['/og-image.png'],
  },
  other: {
    'geo.region': 'NG-FC',
    'geo.placename': 'Abuja',
    'geo.position': '9.0765;7.3986',
    ICBM: '9.0765, 7.3986',
  },
}