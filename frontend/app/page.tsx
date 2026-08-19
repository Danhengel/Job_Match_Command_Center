import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CareerNavIQ | Navigate Your Career",
  description: "CareerNavIQ turns your experience, ambitions, and the live employment market into a clear path forward.",
};

const outcomes = [
  { icon: "⌖", title: "Targeted Opportunities", copy: "Find roles that match your skills, goals, and career direction." },
  { icon: "◇", title: "Smart Insights", copy: "Use practical signals and market context to make stronger decisions." },
  { icon: "↗", title: "Resume Studio", copy: "Tailor your résumé to each opportunity with evidence-based positioning." },
  { icon: "◎", title: "Career Roadmap", copy: "Connect each next step into a clear path toward your next goal." },
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
            <Link href="/register" className="premium-header-cta">Get Started</Link>
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
              <Link href="/register" className="mobile-menu-cta">Get Started</Link>
            </nav>
          </details>
        </div>
      </header>

      <main>
        <section className="premium-hero">
          <div className="premium-shell premium-hero-grid">
            <div className="premium-hero-copy">
              <img
                className="premium-hero-logo premium-hero-logo-unframed premium-hero-logo-classic"
                src="/careernaviq-logo-home.png?v=20260819classic"
                alt="CareerNavIQ"
              />
              <h1 className="premium-hero-message">
                <span>Know your value.</span>
                <span>See your path.</span>
                <em>Make your move.</em>
              </h1>
              <div className="premium-rule" aria-hidden="true"><span /></div>
              <p className="premium-lead">CareerNavIQ combines intelligent insights with real opportunities so you can navigate your career with clarity and confidence.</p>
              <div className="premium-actions premium-actions-refined">
                <Link href="/register" className="premium-button premium-button-primary">Get Started</Link>
                <Link href="/features" className="premium-button premium-button-secondary">See How It Works</Link>
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
