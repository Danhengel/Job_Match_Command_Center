import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CareerNavIQ | Navigate Your Career",
  description: "CareerNavIQ gives you strategic insight, targeted opportunities, and confidence to navigate your next career step.",
};

const outcomes = [
  {
    icon: "◎",
    title: "Targeted Opportunities",
    copy: "Access curated roles that match your goals, experience, and market demand.",
  },
  {
    icon: "↗",
    title: "Strategic Insights",
    copy: "Leverage data-driven insights and salary intelligence to negotiate with confidence.",
  },
  {
    icon: "▤",
    title: "Stand Out",
    copy: "Craft a powerful personal brand and resume that gets noticed by the right people.",
  },
  {
    icon: "◇",
    title: "Navigate With Confidence",
    copy: "From application to offer, we guide you every step of the way.",
  },
];

export default function HomePage() {
  return (
    <div className="premium-home premium-home-reference">
      <header className="premium-header premium-reference-header">
        <div className="premium-shell premium-header-inner premium-reference-header-inner">
          <nav className="premium-nav premium-reference-nav" aria-label="Main navigation">
            <Link href="/features">Platform</Link>
            <Link href="/features">How It Works</Link>
            <Link href="/features">Solutions</Link>
            <Link href="/ai-job-search">Resources</Link>
            <Link href="/about">About</Link>
          </nav>

          <div className="premium-header-actions">
            <Link href="/login" className="premium-header-signin">Sign In</Link>
            <Link href="/register" className="premium-header-cta">Get Started</Link>
          </div>

          <details className="premium-mobile-menu">
            <summary aria-label="Open navigation menu"><span /><span /><span /></summary>
            <nav aria-label="Mobile navigation">
              <Link href="/features">Platform</Link>
              <Link href="/features">How It Works</Link>
              <Link href="/features">Solutions</Link>
              <Link href="/ai-job-search">Resources</Link>
              <Link href="/about">About</Link>
              <Link href="/login">Sign In</Link>
              <Link href="/register" className="mobile-menu-cta">Get Started</Link>
            </nav>
          </details>
        </div>
      </header>

      <main className="premium-reference-main">
        <section className="premium-hero premium-reference-hero">
          <div className="premium-shell premium-reference-hero-shell">
            <div className="premium-hero-copy premium-reference-copy">
              <img
                className="premium-hero-logo premium-hero-logo-unframed premium-hero-logo-classic"
                src="/careernaviq-logo-hero-transparent.png?v=20260819full"
                width="1920"
                height="547"
                alt="CareerNavIQ"
              />

              <h1 className="premium-hero-message">
                <span>Know your value.</span>
                <span>See your path.</span>
                <em>Make your move.</em>
              </h1>

              <p className="premium-lead">
                CareerNavIQ gives you the strategic insight, targeted opportunities, and confidence to navigate your next career step with clarity and precision.
              </p>

              <div className="premium-actions premium-actions-refined">
                <Link href="/register" className="premium-button premium-button-primary">
                  <span>Get Started</span><span aria-hidden="true">→</span>
                </Link>
                <Link href="/features" className="premium-button premium-button-secondary">
                  <span aria-hidden="true" className="premium-play">▶</span><span>See How It Works</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="premium-shell premium-outcome-wrap premium-reference-outcomes">
            <div className="premium-outcome-grid">
              {outcomes.map((outcome) => (
                <article key={outcome.title}>
                  <div className="premium-outcome-icon" aria-hidden="true"><span>{outcome.icon}</span></div>
                  <h2>{outcome.title}</h2>
                  <p>{outcome.copy}</p>
                  <span className="premium-outcome-accent" aria-hidden="true" />
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
