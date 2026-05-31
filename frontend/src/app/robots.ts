import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/demo', '/llms.txt', '/llms-full.txt', '/ai.txt'],
        disallow: [
          '/dashboard',
          '/agents',
          '/matches',
          '/deals',
          '/market',
          '/metrics',
          '/admin',
          '/api/',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: ['/', '/llms.txt', '/llms-full.txt', '/demo'],
        disallow: ['/api/', '/admin'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/llms.txt', '/llms-full.txt', '/demo'],
        disallow: ['/api/', '/admin'],
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/llms.txt', '/demo'],
        disallow: ['/api/', '/admin'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: ['/api/', '/admin'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/llms.txt', '/llms-full.txt', '/demo'],
        disallow: ['/api/', '/admin'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
