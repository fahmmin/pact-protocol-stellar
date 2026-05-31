import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { rootMetadata } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site';

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

export const metadata: Metadata = rootMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <head>
        <link
          rel="alternate"
          type="text/plain"
          href={`${getSiteUrl()}/llms.txt`}
          title="LLM-readable site summary"
        />
        <link rel="author" type="text/plain" href={`${getSiteUrl()}/llms-full.txt`} />
      </head>
      <body>{children}</body>
    </html>
  );
}
