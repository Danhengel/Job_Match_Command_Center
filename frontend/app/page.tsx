import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CareerNavIQ | Navigate Your Career",
  description:
    "CareerNavIQ brings clarity, direction, confidence, and momentum to every step of your career journey.",
};

const outcomes = [
  { number: "01", title: "Clarity", copy: "See your strengths, priorities, and possibilities with a sharper point of view." },
  { number: "02", title: "Direction", copy: "Turn insight into a focused career strategy and a practical path forward." },
  { number: "03", title: "Confidence", copy: "Show up prepared with a stronger story, tailored materials, and clear next steps." },
  { number: "04", title: "Results", copy: "Build momentum, manage opportunities, and keep moving toward the work you want." },
];

function HeroCompass() {
  return (
    <div className="premium-compass" aria-hidden="true">
      <div className="premium-compass-orbit premium-compass-orbit-outer" />
      <div className="premium-compass-orbit premium-compass-orbit-inner" />
      <span className="premium-compass-point premium-compass-n">N</span>
      <span className="premium-compass-point premium-compass-e">E</span>
      <span className="premium-compass-point premium-compass-s">S</span>
      <span className="premium-compass-point premium-compass-w">W</span>
      <div className="premium-compass-needle"><span /></div>
      <div className="premium-compass-core" />
      <div className="premium-compass-route"><i /><i /><i /></div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="premium-home">
      <header className="premium-header">
        <div className="premium-shell premium-header-inner">
          <Link href="/" className="premium-brand" aria-label="CareerNavIQ home">
            <Image src="/careernaviq-logo.svg" width={260} height={70} priority alt="CareerNavIQ" />
            <span>Clarity for What&apos;s Next</span>
          </Link>
          <nav className="premium-nav" aria-label="Main navigation">
            <a href="#how-it-helps">How it helps</a>
            <Link href="/login">Sign in</Link>
            <Link href="/register" className="premium-nav-cta">Get started</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="premium-hero">
          <div className="premium-grid-lines" aria-hidden="true" />
          <div className="premium-shell premium-hero-grid">
            <div className="premium-hero-copy">
              <p className="premium-kicker"><span /> Career intelligence, centered on you</p>
              <h1>Navigate Your Career.<br /><em>Achieve What&apos;s Next.</em></h1>
              <p className="premium-lead">
                CareerNavIQ brings your goals, opportunities, applications, and preparation into one clear path—so every move is more intentional.
              </p>
              <div className="premium-actions">
                <Link href="/register" className="premium-button premium-button-primary">Start your journey <span aria-hidden="true">→</span></Link>
                <Link href="/login" className="premium-button premium-button-secondary">Sign in</Link>
              </div>
              <div className="premium-hero-note">
                <span className="premium-note-line" />
                <p><strong>One private workspace.</strong><br />Built to help you make better career decisions.</p>
              </div>
            </div>
            <div className="premium-hero-visual">
              <HeroCompass />
              <div className="premium-coordinate premium-coordinate-top">42° CAREER NORTH</div>
              <div className="premium-coordinate premium-coordinate-bottom">NEXT MOVE / IN SIGHT</div>
            </div>
          </div>
        </section>

        <section id="how-it-helps" className="premium-outcomes">
          <div className="premium-shell">
            <div className="premium-section-intro">
              <p className="premium-kicker"><span /> Your path forward</p>
              <h2>From uncertainty to momentum.</h2>
              <p>A calmer, more connected way to navigate the decisions that shape your career.</p>
            </div>
            <div className="premium-outcome-grid">
              {outcomes.map((outcome) => (
                <article key={outcome.title}>
                  <span className="premium-outcome-number">{outcome.number}</span>
                  <div className="premium-outcome-icon" aria-hidden="true"><i /></div>
                  <h3>{outcome.title}</h3>
                  <p>{outcome.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="premium-final">
          <div className="premium-shell premium-final-inner">
            <div><p className="premium-kicker"><span /> Your next move</p><h2>Ready for greater clarity?</h2></div>
            <Link href="/register" className="premium-button premium-button-primary">Create your account <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </main>

      <footer className="premium-footer">
        <div className="premium-shell"><span>CareerNavIQ</span><p>Clarity for What&apos;s Next</p><div><Link href="/login">Sign in</Link><Link href="/register">Create account</Link></div></div>
      </footer>
    </div>
  );
}
