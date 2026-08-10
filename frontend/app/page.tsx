import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CareerNavIQ | Navigate Your Career",
  description: "CareerNavIQ turns your experience, ambitions, and the live employment market into a clear path forward.",
};

const outcomes = [
  { icon: "✦", title: "Clarity", copy: "Gain clear insight into your strengths, goals, and opportunities." },
  { icon: "⌖", title: "Direction", copy: "Build a strategic roadmap aligned with your ambitions." },
  { icon: "↗", title: "Confidence", copy: "Make empowered decisions and move forward with confidence." },
  { icon: "◎", title: "Results", copy: "Achieve meaningful outcomes and elevate your career." },
];

export default function HomePage() {
  return (
    <div className="premium-home">
      <header className="premium-header">
        <div className="premium-shell premium-header-inner">
          <Link href="/" className="premium-brand" aria-label="CareerNavIQ home">
            <img src="/careernaviq-logo.webp" width="716" height="156" alt="CareerNavIQ" />
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
      </main>
    </div>
  );
}
