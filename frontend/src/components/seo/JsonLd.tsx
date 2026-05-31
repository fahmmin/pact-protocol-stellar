import type { JsonLdGraph } from '@/lib/seo';

type Props = {
  data: JsonLdGraph | JsonLdGraph[];
};

/** Renders Schema.org JSON-LD for crawlers and generative engines. */
export default function JsonLd({ data }: Props) {
  const graphs = Array.isArray(data) ? data : [data];
  const payload =
    graphs.length === 1
      ? graphs[0]
      : { '@context': 'https://schema.org', '@graph': graphs };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
