/** Shared FAQ copy — used by landing UI and FAQPage JSON-LD. */

export type FaqItem = { q: string; a: string };

export const LANDING_FAQS: FaqItem[] = [
  {
    q: 'Why not just use email and a contract?',
    a: 'Contracts are only as good as enforcement. Manual deals rely on trust, follow-ups, and goodwill. Pact enforces terms automatically — budget is escrowed, KPIs are verified by an oracle, and payment releases without either side chasing the other.',
  },
  {
    q: 'What if the creator doesn\'t deliver?',
    a: 'Funds stay locked in escrow until KPIs are verified. If targets aren\'t met, the brand doesn\'t release payment and the creator\'s stake is at risk. Both parties agreed to the metrics before work started.',
  },
  {
    q: 'What if the brand tries to renegotiate after posting?',
    a: 'Terms are signed by both parties when the deal is created. KPIs and payment amount are locked on-chain — scope can\'t be changed retroactively through DMs.',
  },
  {
    q: 'How is this different from an influencer platform?',
    a: 'Marketplaces help you find partners. Pact handles what happens after — escrow, verification, and settlement. You can use Pact for deals you already have, without giving up a cut to a middleman.',
  },
  {
    q: 'What happens when I join the waitlist?',
    a: 'You\'ll get early access as we open the creator and brand portal. Pick "Creator" or "Brand" when signing up so we can send the right onboarding path.',
  },
];
