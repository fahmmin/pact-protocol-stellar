import LandingNav from '@/components/landing/LandingNav';
import '@/styles/landing.css';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing-page min-h-screen">
      <LandingNav />
      {children}
    </div>
  );
}
