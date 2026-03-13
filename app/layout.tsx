import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css'; // Global styles
import { UserProvider } from '@/lib/user-context';
import { Footer } from '@/components/layout/footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'MangaAI - Smart Anime & Manga Tracking',
  description: 'AI-powered tracking and recommendations for anime and manga enthusiasts.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MangaAI',
  },
};

import { MotionProvider } from '@/components/ui/motion-provider';

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-zinc-950 text-zinc-50 flex flex-col min-h-screen" suppressHydrationWarning>
        <UserProvider>
          <MotionProvider>
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </MotionProvider>
        </UserProvider>
      </body>
    </html>
  );
}
