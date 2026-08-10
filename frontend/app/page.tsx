import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CareerNavIQ | Navigate Your Career",
  description: "CareerNavIQ turns your experience, ambitions, and the live employment market into a clear path forward.",
};

const outcomes = [
  { icon: "⌖", title: "Discover", copy: "Uncover your strengths, priorities, and the opportunities worth pursuing." },
  { icon: "◇", title: "Evaluate", copy: "Compare roles and employers with evidence, context, and sharper judgment." },
  { icon: "↗", title: "Position", copy: "Tell a focused story with tailored materials that show the value you bring." },
  { icon: "◎", title: "Advance", copy: "Manage every next step and keep building momentum toward meaningful work." },
];

const credibility = [
  { value: "One clear view", label: "Goals, roles, and applications connected" },
  { value: "Evidence-led", label: "Career decisions grounded in your experience" },
  { value: "Built for momentum", label: "Practical guidance for every next move" },
  { value: "Private by design", label: "Your career workspace stays yours" },
];

export default function HomePage() {
  return (
    <div className="premium-home">
      <header className="premium-header">
        <div className="premium-shell premium-header-inner">
          <Link href="/" className="premium-brand" aria-label="CareerNavIQ home">
            <img src="/careernaviq-logo.png?v=20260810r" width="1227" height="223" alt="CareerNavIQ" />
          </Link>
          <nav className="premium-nav" aria-label="Main navigation">
            <Link href="/" className="is-active">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/features">Services</Link>
            <Link href="/ai-job-search">Resources</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <Link href="/login" className="premium-signin"><span aria-hidden="true">♙</span> Sign in</Link>
        </div>
      </header>

      <main>
        <section className="premium-hero">
          <div className="premium-shell premium-hero-grid">
            <div className="premium-hero-copy">
              <h1>Navigate Your Career.<br/><em>Achieve What&apos;s Next.</em></h1>
              <div className="premium-rule" aria-hidden="true"><span/></div>
              <p className="premium-lead">Strategic guidance. Smarter decisions. Powerful results.<br/>We help you navigate your career with clarity, confidence, and direction.</p>
              <div className="premium-actions">
                <Link href="/register" className="premium-button premium-button-primary">Get started <span aria-hidden="true">→</span></Link>
                <Link href="/features" className="premium-button premium-button-secondary">Learn more</Link>
              </div>
            </div>
            <div className="premium-hero-visual" aria-hidden="true" />
          </div>

          <div className="premium-shell premium-outcome-wrap">
            <div className="premium-outcome-grid">
              {outcomes.map((outcome) => (
                <article key={outcome.title}>
                  <div className="premium-outcome-icon" aria-hidden="true"><span>{outcome.icon}</span></div>
                  <h2>{outcome.title}</h2>
                  <p>{outcome.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="premium-trust" aria-label="Why CareerNavIQ">
          <div className="premium-shell premium-trust-grid">
            {credibility.map((item, index) => (
              <article key={item.value}>
                <span>0{index + 1}</span>
                <strong>{item.value}</strong>
                <p>{item.label}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
