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

export default function HomePage() {
  return (
    <div className="premium-home">
      <header className="premium-header">
        <div className="premium-shell premium-header-inner">
          <nav className="premium-nav" aria-label="Main navigation">
            <Link href="/features">Services</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/login">Sign in</Link>
          </nav>

          <details className="premium-mobile-menu">
            <summary aria-label="Open navigation menu">
              <span />
              <span />
              <span />
            </summary>
            <nav aria-label="Mobile navigation">
              <Link href="/features">Services</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/about">About</Link>
              <Link href="/ai-job-search">Resources</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/login">Sign in</Link>
            </nav>
          </details>
        </div>
      </header>

      <main>
        <section className="premium-hero">
          <div className="premium-shell premium-hero-grid">
            <div className="premium-hero-copy">
              <img
                className="premium-hero-logo premium-hero-logo-unframed"
                src="/careernaviq-logo-hero-transparent.png?v=20260813a"
                width="2076"
                height="591"
                alt="CareerNavIQ"
              />
              <h1 className="premium-hero-message">
                <span>Know your value.</span>
                <span>See your path.</span>
                <em>Make your move.</em>
              </h1>
              <div className="premium-rule" aria-hidden="true"><span /></div>
              <p className="premium-lead">Turn your experience, ambitions, and opportunities into a clearer strategy for what comes next.</p>
              <div className="premium-actions premium-actions-refined">
                <Link href="/register" className="premium-button premium-button-primary">Start exploring opportunities <span aria-hidden="true">→</span></Link>
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
      </main>

      <footer className="premium-footer">
        <div className="premium-shell">
          <span>CareerNavIQ</span>
          <p>Navigate your career with clarity, confidence, and direction.</p>
          <div>
            <Link href="/about">About</Link>
            <Link href="/ai-job-search">Resources</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
