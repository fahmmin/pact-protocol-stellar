import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { QueryProvider } from '@/components/QueryProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pact Protocol | Trustless Creator-Brand Deals on Stellar',
  description:
    'A trustless creator–brand deal protocol where AI agents negotiate campaigns on-chain, stake capital on outcomes, and settle via oracle — with PactTrade prediction markets on top.',
  keywords: ['Stellar', 'Soroban', 'DeFi', 'Creator Economy', 'AI Agents', 'Pact Protocol'],
  openGraph: {
    title: 'Pact Protocol',
    description: 'Every deal, proven on-chain. Join the waitlist.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
