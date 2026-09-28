import type { Metadata, Viewport } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';

import ServiceWorker from '@/components/ServiceWorker';

import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-archivo',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const SITE_URL = 'https://contagorda.com';
const OG_IMAGE = `${SITE_URL}/og-image.png`;
const TITLE = 'ContaGorda — Produtos financeiros para empresas e pessoas';

const DESCRIPTION =
  'A ContaGorda reúne soluções para receber pagamentos e organizar suas finanças: o ContaGorda Pay, gateway de pagamentos, e o ContaGorda Finanças, controle financeiro pessoal.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s — ContaGorda',
  },
  description: DESCRIPTION,
  applicationName: 'ContaGorda',
  keywords: [
    'ContaGorda',
    'ContaGorda Pay',
    'ContaGorda Finanças',
    'gateway de pagamento',
    'pagamentos online',
    'finanças pessoais',
    'controle financeiro',
    'Stripe',
  ],
  authors: [{ name: 'ContaGorda', url: SITE_URL }],
  creator: 'ContaGorda',
  publisher: 'ContaGorda',
  category: 'finance',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: 'ContaGorda',
    url: SITE_URL,
    type: 'website',
    locale: 'pt_BR',
    images: [
      {
        url: OG_IMAGE,
        secureUrl: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'ContaGorda',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, alt: 'ContaGorda' }],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'ContaGorda',
    statusBarStyle: 'black-translucent',
    startupImage: ['/icons/icon-512.png'],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#111111' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'ContaGorda',
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512.png`,
      description: DESCRIPTION,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'ContaGorda',
      inLanguage: 'pt-BR',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-ink antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        {children}

        <ServiceWorker />
      </body>
    </html>
  );
}
