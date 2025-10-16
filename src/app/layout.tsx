import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Moodlink – Ekspresikan Emosi, Temukan Ketenangan',
  description: 'Moodlink adalah tempat menulis jurnal, menyimpan rahasia, dan menemukan ketenangan hati melalui fitur jurnal pribadi, misi harian, dan eksplorasi hashtag emosi.',
  keywords: ['jurnal emosi', 'catatan harian', 'mood tracker', 'self healing', 'overthinking', 'rahasia pribadi', 'misi harian', 'hashtag emosi', 'moodlink'],
  authors: [{ name: 'Moodlink Team' }],
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL('https://mood-link.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://mood-link.vercel.app',
    title: 'Moodlink – Ekspresikan Emosi, Temukan Ketenangan',
    description: 'Tulis jurnal emosimu, simpan rahasia, buka dengan kode. Temukan teman seperasaan lewat hashtag seperti #overthinking, #selfhealing, dan lainnya.',
    images: [
      {
        url: 'https://mood-link.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Moodlink OG Image',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Moodlink – Ekspresikan Emosi, Temukan Ketenangan',
    description: 'Tulis jurnal, ekspresikan emosi, dan buka postingan rahasia dengan kode. Moodlink, tempat healing dan refleksi pribadi.',
    images: ['https://mood-link.vercel.app/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
      <meta name="google-site-verification" content="fiv6UiETGmR4BtqXzSD1llrqaMqmK_yRh-Mc6_OJUnA" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Dancing+Script:wght@400;700&family=Inconsolata:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
