import AnnouncementBar from '@/components/landing/AnnouncementBar';
import Hero from '@/components/landing/Hero';
import TrustStrip from '@/components/landing/TrustStrip';
import FeatureSection from '@/components/landing/FeatureSection';
import CodeTabs from '@/components/landing/CodeTabs';
import UseCases from '@/components/landing/UseCases';
import TestimonialMarquee from '@/components/landing/TestimonialMarquee';
import FAQ from '@/components/landing/FAQ';
import LandingFooter from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <>
      <AnnouncementBar />
      <Hero />
      <TrustStrip />
      <FeatureSection />
      <CodeTabs />
      <UseCases />
      <TestimonialMarquee />
      <FAQ />
      <LandingFooter />
    </>
  );
}
