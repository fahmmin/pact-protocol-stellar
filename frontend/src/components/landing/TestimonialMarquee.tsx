const testimonials = [
  {
    quote: 'One of the best Stellar dApps — interface design and innovation stand out.',
    author: 'Farseen Hallag',
    role: 'Early tester',
  },
  {
    quote: 'Flawless performance. Strongly agree on transparency and Stellar ecosystem integration.',
    author: 'Ashank Mishra',
    role: 'Early tester',
  },
  {
    quote: 'Would recommend 10/10. The onboarding flow and unique features are exceptional.',
    author: 'Thomas Sajeev Varghese',
    role: 'Early tester',
  },
  {
    quote: 'Interface design, speed, and clarity — everything you want in a creator economy protocol.',
    author: 'Ayush Singh',
    role: 'Early tester',
  },
  {
    quote: 'API access for developers to build on Pact Protocol — wonderful smooth experience.',
    author: 'Prashil Thul',
    role: 'Early tester',
  },
];

export default function TestimonialMarquee() {
  return (
    <section className="overflow-hidden border-y border-white/[0.06] py-16">
      <div className="mb-8 text-center">
        <p className="landing-section-label mb-2">[ Community ]</p>
        <h2 className="text-2xl font-bold">People love building with Pact</h2>
        <p className="mt-2 text-sm text-landing-muted">
          4.9 / 5 average rating · 29 testnet users · 90% would recommend
        </p>
      </div>

      <div className="relative">
        <div className="flex animate-marquee gap-6">
          {[...testimonials, ...testimonials].map((t, i) => (
            <div
              key={`${t.author}-${i}`}
              className="w-80 shrink-0 landing-card p-5"
            >
              <p className="mb-4 text-sm leading-relaxed text-white/80">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div>
                <p className="text-sm font-medium">{t.author}</p>
                <p className="text-xs text-landing-muted">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
