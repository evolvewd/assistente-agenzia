import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Travel Alert Hub | Agenzia Viaggi',
  description: 'Monitoraggio in tempo reale di scioperi, cancellazioni e ritardi per voli, treni e navi.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${inter.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning className="font-sans antialiased bg-stone-50 text-stone-900">
        {children}
      </body>
    </html>
  );
}
