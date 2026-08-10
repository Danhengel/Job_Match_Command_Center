import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CareerNavIQ | Executive career intelligence",
  description: "A private executive career platform for positioning, market intelligence, opportunity management, and interview preparation.",
};

function CompassMark({ className = "" }: { className?: string }) {
  return (
    <span className={`landing-compass ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 64 64" role="img">
        <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="4" />
        <path d="M40.5 23.5 35 35l-11.5 5.5L29 29l11.5-5.5Z" fill="currentColor" />
        <circle cx="32" cy="32" r="3.5" fill="white" />
      </svg>
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="landing-page executive-public-site">
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <Link href="/" className="landing-brand" aria-label="CareerNavIQ home">
            <CompassMark />
            <span className="landing-wordmark"><span>Career</span><span>Nav</span><span>IQ</span></span>
          </Link>
          <nav className="landing-nav" aria-label="Public navigation">
            <a href="#platform">Platform</a>
            <a href="#approach">Approach</a>
            <Link href="/login">Sign in</Link>
            <Link href="/register" className="landing-nav-cta">Create account</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-hero executive-landing-hero">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow">EXECUTIVE CAREER INTELLIGENCE</p>
              <h1>Your career deserves more than a job board.</h1>
              <p className="landing-hero-lead">
                CareerNavIQ brings executive positioning, live market intelligence, opportunity management,
                relationship strategy, and interview preparation into one private decision platform.
              </p>
              <div className="landing-hero-actions">
                <Link href="/register" className="landing-button landing-button-primary">Create my executive profile <span aria-hidden="true">→</span></Link>
                <a href="#platform" className="landing-button landing-button-secondary">Explore the platform</a>
              </div>
              <div className="executive-proof-line">
                <span>Private by design</span><span>Built for senior-level searches</span><span>Focused on decisions, not volume</span>
              </div>
            </div>

            <figure className="executive-hero-image" aria-label="CareerNavIQ executive career intelligence visual">
              <Image
                src="/premium-career-visual.svg"
                alt="Executive career intelligence interface with navigation, market signals, and strategic path visualization"
                width={720}
                height={420}
                priority
              />
              <figcaption>
                <span>POSITION · MARKET · DECISION</span>
                <strong>A private operating view for your next executive move.</strong>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="executive-trust-strip">
          <div className="landing-container">
            <span>Positioning</span><span>Market intelligence</span><span>Opportunity portfolio</span><span>Relationship management</span><span>Interview advisory</span>
          </div>
        </section>

        <section id="platform" className="landing-section executive-platform-section">
          <div className="landing-container">
            <div className="landing-section-heading executive-section-heading-public">
              <p className="landing-eyebrow">ONE EXECUTIVE WORKSPACE</p>
              <h2>Manage the search at the level of the decision.</h2>
              <p>CareerNavIQ replaces scattered spreadsheets, browser tabs, generic alerts, and disconnected notes with a controlled executive workflow.</p>
            </div>
            <div className="executive-value-grid">
              <article><span>01</span><h3>Executive positioning</h3><p>Define target roles, compensation, geography, strengths, and the evidence behind your next move.</p></article>
              <article><span>02</span><h3>Market intelligence</h3><p>Evaluate live opportunities against your position while suppressing duplicate and low-value job-board noise.</p></article>
              <article><span>03</span><h3>Opportunity portfolio</h3><p>Manage serious pursuits, stage movement, relationships, follow-ups, interviews, and decisions in one view.</p></article>
            </div>
          </div>
        </section>

        <section id="approach" className="landing-section executive-approach-section">
          <div className="landing-container executive-approach-layout">
            <div className="executive-approach-copy">
              <p className="landing-eyebrow">A MORE DISCIPLINED SEARCH</p>
              <h2>Designed to help senior professionals make fewer, better career decisions.</h2>
              <p>Most career software optimizes for activity. CareerNavIQ is built around selectivity, executive evidence, market context, and follow-through.</p>
              <Link href="/register" className="landing-text-link">Build your executive workspace <span aria-hidden="true">→</span></Link>
            </div>
            <div className="executive-approach-list">
              <article><span>01</span><div><h3>Establish the mandate</h3><p>Clarify what the next role must deliver professionally, financially, and personally.</p></div></article>
              <article><span>02</span><div><h3>Read the market</h3><p>Review opportunities and companies against your actual experience and priorities.</p></div></article>
              <article><span>03</span><div><h3>Prepare the pursuit</h3><p>Tailor résumé evidence, outreach, and interview strategy to the opportunity in front of you.</p></div></article>
              <article><span>04</span><div><h3>Manage the portfolio</h3><p>Keep active opportunities, relationships, decisions, and follow-ups under control.</p></div></article>
            </div>
          </div>
        </section>

        <section className="landing-section executive-capabilities-section">
          <div className="landing-container">
            <div className="landing-section-heading executive-section-heading-public">
              <p className="landing-eyebrow">CORE CAPABILITIES</p>
              <h2>Everything important. Nothing that makes the process feel like another job board.</h2>
            </div>
            <div className="executive-capability-grid">
              <article><span>EP</span><h3>Executive profile</h3><p>A single mandate for target roles, compensation, geography, and priorities.</p></article>
              <article><span>MI</span><h3>Market intelligence</h3><p>Live opportunity evaluation with alignment scoring and cleaner market coverage.</p></article>
              <article><span>PS</span><h3>Positioning studio</h3><p>Role-specific résumé evidence and executive narrative development.</p></article>
              <article><h3>Opportunity portfolio</h3><p>Controlled pursuit management across applications, stages, and decisions.</p></article>
              <article><h3>Relationship network</h3><p>Recruiter, hiring-team, and professional relationship follow-through.</p></article>
              <article><h3>Interview advisory</h3><p>Preparation, practice, executive stories, questions, and follow-up.</p></article>
            </div>
          </div>
        </section>

        <section className="landing-final-cta executive-final-cta">
          <div className="landing-container landing-final-card executive-final-card">
            <div>
              <p className="landing-eyebrow">CAREER DECISIONS, MANAGED WITH INTENTION</p>
              <h2>Build a more disciplined executive search.</h2>
              <p>Bring your position, market, opportunities, relationships, and preparation into one private workspace.</p>
            </div>
            <Link href="/register" className="landing-button landing-button-light">Create account <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div>
            <Link href="/" className="landing-brand landing-footer-brand"><CompassMark className="landing-compass-small" /><span className="landing-wordmark"><span>Career</span><span>Nav</span><span>IQ</span></span></Link>
            <p>Executive career intelligence and decision support.</p>
          </div>
          <div className="landing-footer-links"><Link href="/login">Sign in</Link><Link href="/register">Create account</Link><span>CareerNavIQ.com</span></div>
        </div>
      </footer>
    </div>
  );
}
