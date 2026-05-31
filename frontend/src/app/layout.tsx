import type { Metadata } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import '@/styles/globals.css';
import { rootMetadata } from '@/lib/seo';
import { getSiteUrl } from '@/lib/site';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
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
    <html lang="en" className={`${plusJakarta.variable} ${jetbrains.variable}`}>
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
