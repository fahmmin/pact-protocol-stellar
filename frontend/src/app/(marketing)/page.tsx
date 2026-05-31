import Hero from '@/components/landing/Hero';
import TrustStrip from '@/components/landing/TrustStrip';
import WhyPact from '@/components/landing/WhyPact';
import HeroDealFlow from '@/components/landing/HeroDealFlow';
import UseCases from '@/components/landing/UseCases';
import FAQ from '@/components/landing/FAQ';
import LandingFooter from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <WhyPact />
      <HeroDealFlow />
      <UseCases />
      <FAQ />
      <LandingFooter />
    </>
  );
}
