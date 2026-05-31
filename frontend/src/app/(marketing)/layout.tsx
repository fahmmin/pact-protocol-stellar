import LandingNav from '@/components/landing/LandingNav';
import AnnouncementBar from '@/components/landing/AnnouncementBar';
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
    <div className="landing-page min-h-screen font-sans">
      <JsonLd
        data={[
          organizationJsonLd(),
          webSiteJsonLd(),
          softwareApplicationJsonLd(),
          faqPageJsonLd(LANDING_FAQS),
        ]}
      />
      <AnnouncementBar />
      <LandingNav />
      {children}
    </div>
  );
}
