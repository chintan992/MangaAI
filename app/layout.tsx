import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css'; // Global styles
import { UserProvider } from '@/lib/user-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'MangaAI - Personalized Manga Recommendations',
  description: 'AI-driven SaaS platform for personalized manga recommendations using the Anilist API.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-zinc-950 text-zinc-50" suppressHydrationWarning>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
