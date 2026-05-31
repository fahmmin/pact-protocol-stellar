import LandingNav from '@/components/landing/LandingNav';
import JsonLd from '@/components/seo/JsonLd';
import { LANDING_FAQS } from '@/lib/faq';
import {
  faqPageJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
  webSiteJsonLd,
} from '@/lib/seo';
import '@/styles/landing.css';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing-page min-h-screen">
      <JsonLd
        data={[
          organizationJsonLd(),
          webSiteJsonLd(),
          softwareApplicationJsonLd(),
          faqPageJsonLd(LANDING_FAQS),
        ]}
      />
      <LandingNav />
      {children}
    </div>
  );
}
