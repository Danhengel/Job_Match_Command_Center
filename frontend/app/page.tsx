import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CareerNavIQ | Navigate Your Career",
  description: "CareerNavIQ turns your experience, ambitions, and the live employment market into a clear path forward.",
};

const outcomes = [
  { icon: "✦", title: "Discover", copy: "See opportunities you may not have considered." },
  { icon: "⌕", title: "Evaluate", copy: "Understand where you actually compete." },
  { icon: "↗", title: "Position", copy: "Build your strongest professional narrative." },
  { icon: "◎", title: "Advance", copy: "Move toward the opportunities that matter." },
];

function CompassVisual() {
  return (
    <div className="hero-art" aria-hidden="true">
      <div className="hero-architecture"><i/><i/><i/><i/><i/></div>
      <div className="hero-route"><span/><span/><span/></div>
      <div className="hero-compass">
        <div className="hero-ring hero-ring-one" />
        <div className="hero-ring hero-ring-two" />
        <div className="hero-ring hero-ring-three" />
        <b className="hero-n">N</b><b className="hero-e">E</b><b className="hero-s">S</b><b className="hero-w">W</b>
        <div className="hero-needle"><i/><i/></div>
        <div className="hero-core" />
      </div>
      <span className="hero-coordinate hero-coordinate-one">39.7392° N<br/>104.9903° W</span>
      <span className="hero-coordinate hero-coordinate-two">OPPORTUNITY<br/>AHEAD</span>
      <span className="hero-coordinate hero-coordinate-three">34.0522° N<br/>118.2437° W</span>
    </div>
  );
}

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
              <p className="premium-eyebrow">Strategic insight. Targeted opportunities. Meaningful results.</p>
              <h1>Navigate Your Career.<br/><em>Achieve What&apos;s Next.</em></h1>
              <div className="premium-rule" aria-hidden="true"><span/><i>✦</i><span/></div>
              <p className="premium-lead">CareerNavIQ turns your experience, ambitions, and the live employment market into a clear path forward.</p>
              <div className="premium-actions">
                <Link href="/register" className="premium-button premium-button-primary">Explore my path <span aria-hidden="true">→</span></Link>
                <Link href="/features" className="premium-button premium-button-secondary">See how it works</Link>
              </div>
            </div>
            <div className="premium-hero-visual"><CompassVisual /></div>
          </div>

          <div className="premium-shell premium-outcome-wrap">
            <div className="premium-outcome-grid">
              {outcomes.map((outcome) => (
                <article key={outcome.title}>
                  <div className="premium-outcome-icon" aria-hidden="true"><span>{outcome.icon}</span></div>
                  <h2>{outcome.title}</h2>
                  <i className="premium-teal-rule" aria-hidden="true" />
                  <p>{outcome.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="premium-trust">
          <div className="premium-shell premium-trust-grid">
            <article><span>PRIVATE BY DESIGN</span><strong>One career workspace</strong><p>Your search, materials, and next moves stay organized in one place.</p></article>
            <article><span>MARKET INTELLIGENCE</span><strong>See the signal</strong><p>Focus on opportunities aligned with your experience and direction.</p></article>
            <article><span>POSITIONING</span><strong>Tell the right story</strong><p>Shape your resume and narrative around the role in front of you.</p></article>
            <article><span>PREPARATION</span><strong>Move prepared</strong><p>Turn every interview and follow-up into a more intentional next step.</p></article>
          </div>
        </section>

        <section className="premium-next">
          <div className="premium-shell premium-next-inner">
            <div><p className="premium-eyebrow">One navigation system for what comes next.</p><h2>Make your next career move with greater clarity.</h2></div>
            <Link href="/register" className="premium-button premium-button-primary">Create your account <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </main>

      <footer className="premium-footer">
        <div className="premium-shell"><span>CareerNavIQ</span><p>Clarity for What&apos;s Next</p><div><Link href="/about">About</Link><Link href="/privacy">Privacy</Link><Link href="/contact">Contact</Link></div></div>
      </footer>
    </div>
  );
}
