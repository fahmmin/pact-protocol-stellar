import type { Metadata } from 'next';
import {
  COMMUNITY_FORM_URL,
  DEMO_VIDEO_URL,
  GITHUB_URL,
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TAGLINE,
  getSiteUrl,
} from '@/lib/site';
import type { FaqItem } from '@/lib/faq';

type PageMetaInput = {
  title: string;
  description?: string;
  path?: string;
  /** Index this URL in search (default true for marketing pages). */
  index?: boolean;
  /** Include in XML sitemap (default follows index). */
  sitemap?: boolean;
  ogType?: 'website' | 'article';
};

export function absoluteUrl(path = ''): string {
  const base = getSiteUrl();
  if (!path || path === '/') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = '/',
  index = true,
  ogType = 'website',
}: PageMetaInput): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = path === '/' ? `${SITE_NAME} | ${SITE_TAGLINE}` : `${title} | ${SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    keywords: [...SITE_KEYWORDS],
    authors: [{ name: SITE_AUTHOR, url: GITHUB_URL }],
    creator: SITE_AUTHOR,
    publisher: SITE_NAME,
    metadataBase: new URL(getSiteUrl()),
    alternates: {
      canonical: url,
    },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        }
      : { index: false, follow: false, nocache: true },
    openGraph: {
      type: ogType,
      locale: SITE_LOCALE,
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      creator: '@PactProtocol',
    },
    category: 'technology',
    applicationName: SITE_NAME,
    other: {
      'ai-content-declaration': 'human-authored',
    },
  };
}

export const rootMetadata: Metadata = {
  ...buildPageMetadata({ title: SITE_NAME, path: '/' }),
  title: {
    default: `${SITE_NAME} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon', type: 'image/png' }],
    apple: [{ url: '/apple-icon', type: 'image/png' }],
  },
};

/** App shell routes — not for public search indexing. */
export const APP_NOINDEX_METADATA: Metadata = {
  robots: { index: false, follow: false, nocache: true, noimageindex: true },
};

export function organizationJsonLd() {
  const url = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url,
    logo: absoluteUrl('/icon'),
    description: SITE_DESCRIPTION,
    sameAs: [GITHUB_URL, DEMO_VIDEO_URL],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'community feedback',
      url: COMMUNITY_FORM_URL,
    },
  };
}

export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: getSiteUrl(),
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
    publisher: { '@type': 'Organization', name: SITE_NAME },
  };
}

export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: SITE_DESCRIPTION,
    url: getSiteUrl(),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Soroban smart contract escrow (DealVault)',
      'AI agent negotiation runtime',
      'Campaign oracle settlement',
      'PactTrade binary prediction markets',
    ],
  };
}

export function faqPageJsonLd(faqs: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}

export function videoObjectJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: 'Pact Protocol Demo — AI Agents on Stellar Soroban',
    description:
      'Demonstration of decentralized AI agents negotiating creator–brand deals, escrowing USDC, and settling via on-chain oracle on Stellar Testnet.',
    thumbnailUrl: 'https://i.ytimg.com/vi/yGr_Yi7kSV4/hqdefault.jpg',
    uploadDate: '2026-04-01',
    contentUrl: DEMO_VIDEO_URL,
    embedUrl: 'https://www.youtube.com/embed/yGr_Yi7kSV4',
    publisher: { '@type': 'Organization', name: SITE_NAME },
  };
}

export type JsonLdGraph = Record<string, unknown> | Record<string, unknown>[];
