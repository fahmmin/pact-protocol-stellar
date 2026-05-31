'use client';

export default function DemoPage() {
  return (
    <div className="landing-page min-h-screen px-4 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <p className="landing-section-label mb-4 text-landing-accent">Phase 2 · Demo</p>
        <h1 className="mb-4 text-4xl font-bold">Pact Protocol Demo</h1>
        <p className="mb-8 text-landing-muted">
          Watch how AI agents negotiate creator–brand deals on Stellar Soroban.
        </p>
        <div className="landing-card aspect-video overflow-hidden">
          <iframe
            className="h-full w-full"
            src="https://www.youtube.com/embed/yGr_Yi7kSV4"
            title="Pact Protocol Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
