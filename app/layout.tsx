import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carolinaalfaroorfebreria.cl';
const siteName = 'Carolina Alfaro Orfebrería';
const description = 'Orfebrería de autor en Chile: piezas únicas, trabajos por encargo, anillos, aros, collares y joyería artesanal en plata.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Joyería artesanal en Chile`,
    template: `%s | ${siteName}`,
  },
  description,
  applicationName: siteName,
  keywords: [
    'orfebrería en Chile',
    'orfebrería Lampa',
    'orfebrería Batuco',
    'joyería artesanal Chile',
    'joyas de plata hechas a mano',
    'anillos artesanales',
    'aros artesanales',
    'collares artesanales',
    'joyería por encargo',
    'Carolina Alfaro Orfebrería',
  ],
  authors: [{ name: 'Carolina Alfaro' }],
  creator: 'Carolina Alfaro',
  publisher: siteName,
  category: 'Joyería artesanal',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: '/',
    siteName,
    title: `${siteName} | Joyería artesanal en Chile`,
    description,
    images: [{ url: '/images/ring-fabric.jpg', width: 1200, height: 1500, alt: 'Anillo artesanal sobre tela' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} | Joyería artesanal en Chile`,
    description,
    images: ['/images/ring-fabric.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/favicon-192.png',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': ['JewelryStore', 'LocalBusiness'],
  '@id': `${siteUrl}/#carolina-alfaro-orfebreria`,
  name: siteName,
  url: siteUrl,
  description,
  image: `${siteUrl}/images/ring-fabric.jpg`,
  logo: `${siteUrl}/favicon-512.png`,
  sameAs: ['https://www.instagram.com/carolinaalfaroorfebreria/'],
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Batuco',
    addressRegion: 'Región Metropolitana',
    addressCountry: 'CL',
  },
  areaServed: [
    { '@type': 'Place', name: 'Batuco' },
    { '@type': 'Place', name: 'Lampa' },
    { '@type': 'Place', name: 'Región Metropolitana' },
    { '@type': 'Country', name: 'Chile' },
  ],
  makesOffer: [
    { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Anillos artesanales' } },
    { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Aros artesanales' } },
    { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Collares artesanales' } },
    { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Joyería artesanal por encargo' } },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CL">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}
      </body>
    </html>
  );
}
