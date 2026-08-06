import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CareerNavIQ | Your private career office",
  description:
    "A private career-intelligence office for leaders who want to shape their position, evaluate the market, and advance with intent.",
};

function CompassMark({ className = "" }: { className?: string }) {
  return (
    <span className={`landing-compass ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 64 64" role="img">
        <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="4" />
        <path d="M40.5 23.5 35 35l-11.5 5.5L29 29l11.5-5.5Z" fill="currentColor" />
        <circle cx="32" cy="32" r="3.5" fill="white" />
        <path d="M32 2v7M32 55v7M2 32h7M55 32h7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function CheckIcon() {
  return <span className="landing-check" aria-hidden="true">✓</span>;
}

export default function HomePage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <Link href="/" className="landing-brand" aria-label="CareerNavIQ home">
            <CompassMark />
            <span className="landing-wordmark">
              <span className="landing-word-career">Career</span>
              <span className="landing-word-nav">Nav</span>
              <span className="landing-word-iq">IQ</span>
            </span>
          </Link>

          <nav className="landing-nav" aria-label="Public navigation">
            <a href="#how-it-works">Method</a>
            <a href="#features">Private office</a>
            <Link href="/login">Member access</Link>
            <Link href="/register" className="landing-nav-cta">Request access</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow">PRIVATE CAREER INTELLIGENCE</p>
              <h1>Your career deserves a private office.</h1>
              <p className="landing-hero-lead">
                CareerNavIQ brings your experience, ambitions, relationships, and market
                opportunities into one composed system for better decisions.
              </p>

              <div className="landing-hero-actions">
                <Link href="/register" className="landing-button landing-button-primary">
                  Establish my private office
                  <span aria-hidden="true">→</span>
                </Link>
                <a href="#how-it-works" className="landing-button landing-button-secondary">
                  Discover the method
                </a>
              </div>

              <div className="landing-proof-row" aria-label="CareerNavIQ benefits">
                <span><CheckIcon /> Discreet by design</span>
                <span><CheckIcon /> Personal intelligence</span>
                <span><CheckIcon /> Decisions with intent</span>
              </div>
            </div>

            <div className="landing-product-preview" aria-label="Illustrative CareerNavIQ product preview">
              <div className="landing-preview-glow" />
              <div className="landing-dashboard-window">
                <div className="landing-dashboard-topbar">
                  <div className="landing-mini-brand">
                    <CompassMark className="landing-compass-small" />
                    <strong>CareerNavIQ</strong>
                  </div>
                  <span className="landing-preview-label">Private office preview</span>
                </div>

                <div className="landing-dashboard-body">
                  <aside className="landing-preview-sidebar" aria-hidden="true">
                    <span className="active" />
                    <span />
                    <span />
                    <span />
                    <span />
                  </aside>

                  <div className="landing-preview-content">
                    <div className="landing-preview-heading">
                      <div>
                        <small>THE MORNING BRIEF</small>
                        <strong>Your private career office</strong>
                      </div>
                      <span>3 decisions today</span>
                    </div>

                    <div className="landing-preview-stats">
                      <div><small>Priority signals</small><strong>12</strong><span>Market intelligence</span></div>
                      <div><small>Active pursuits</small><strong>5</strong><span>1 decision due</span></div>
                      <div><small>Briefings</small><strong>2</strong><span>Preparation ready</span></div>
                    </div>

                    <div className="landing-preview-grid">
                      <section className="landing-preview-card landing-preview-priority">
                        <div className="landing-card-heading">
                          <div><small>PRIORITY ADVISORY</small><strong>Refine your opportunity thesis</strong></div>
                          <span>72%</span>
                        </div>
                        <p>A precise mandate brings sharper intelligence and better decisions.</p>
                        <div className="landing-progress"><span /></div>
                        <button type="button" tabIndex={-1}>Review advisory</button>
                      </section>

                      <section className="landing-preview-card">
                        <div className="landing-card-heading">
                          <div><small>MARKET INTELLIGENCE</small><strong>Selected opportunities</strong></div>
                          <span className="landing-green-pill">Private brief</span>
                        </div>
                        <div className="landing-job-row"><span>94</span><div><strong>Senior Product Manager</strong><small>Remote · Strong experience match</small></div></div>
                        <div className="landing-job-row"><span>91</span><div><strong>Operations Director</strong><small>Chicago · Leadership alignment</small></div></div>
                        <div className="landing-job-row"><span>88</span><div><strong>Customer Success Lead</strong><small>Hybrid · Transferable skills match</small></div></div>
                      </section>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-value-strip" aria-label="Core CareerNavIQ value">
          <div className="landing-container landing-value-grid">
            <article>
              <span className="landing-value-number">01</span>
              <div><h2>Define your position</h2><p>Clarify the value, evidence, and ambition that shape your next chapter.</p></div>
            </article>
            <article>
              <span className="landing-value-number">02</span>
              <div><h2>Read the market</h2><p>Evaluate organizations, opportunities, and signals through your personal mandate.</p></div>
            </article>
            <article>
              <span className="landing-value-number">03</span>
              <div><h2>Advance with intent</h2><p>Manage every pursuit, relationship, conversation, and decision with precision.</p></div>
            </article>
          </div>
        </section>

        <section id="how-it-works" className="landing-section landing-how">
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-eyebrow">A MORE DELIBERATE WAY FORWARD</p>
              <h2>From reactive searching to deliberate career architecture.</h2>
              <p>CareerNavIQ brings the rigor of a private advisory office to every important career decision.</p>
            </div>

            <div className="landing-steps">
              <article><span>1</span><h3>Establish your position</h3><p>Distill your experience, strengths, ambition, and point of view.</p></article>
              <article><span>2</span><h3>Develop intelligence</h3><p>Read the market through opportunities aligned to your personal mandate.</p></article>
              <article><span>3</span><h3>Shape the approach</h3><p>Create precise materials and correspondence for each serious pursuit.</p></article>
              <article><span>4</span><h3>Manage the portfolio</h3><p>Keep every relationship, commitment, deadline, and next decision in view.</p></article>
              <article><span>5</span><h3>Advance decisively</h3><p>Prepare your evidence, rehearse the conversation, and follow through with intent.</p></article>
            </div>
          </div>
        </section>

        <section id="features" className="landing-section landing-features-section">
          <div className="landing-container landing-features-layout">
            <div className="landing-feature-intro">
              <p className="landing-eyebrow">YOUR PRIVATE CAREER OFFICE</p>
              <h2>A singular view of the career you are building.</h2>
              <p>
                Replace fragmented tools and reactive searching with a composed environment
                where intelligence, evidence, relationships, and decisions stay connected.
              </p>
              <Link href="/register" className="landing-text-link">Enter the private office <span aria-hidden="true">→</span></Link>
            </div>

            <div className="landing-feature-grid">
              <article><span aria-hidden="true">◇</span><h3>Opportunity intelligence</h3><p>Evaluate selected opportunities against the mandate that matters to you.</p></article>
              <article><span aria-hidden="true">✦</span><h3>Positioning atelier</h3><p>Translate your experience into a compelling, evidence-led narrative.</p></article>
              <article><span aria-hidden="true">▤</span><h3>Opportunity portfolio</h3><p>See every active pursuit, decision, commitment, and next move.</p></article>
              <article><span aria-hidden="true">◎</span><h3>Executive briefings</h3><p>Prepare your stories, questions, and point of view for pivotal conversations.</p></article>
              <article><span aria-hidden="true">◌</span><h3>Relationship capital</h3><p>Steward the people, conversations, and follow-through behind every opportunity.</p></article>
              <article><span aria-hidden="true">↗</span><h3>Portfolio intelligence</h3><p>Use patterns and outcomes to make sharper decisions over time.</p></article>
            </div>
          </div>
        </section>

        <section className="landing-final-cta">
          <div className="landing-container landing-final-card">
            <CompassMark className="landing-final-compass" />
            <div>
              <p className="landing-eyebrow">THE NEXT CHAPTER SHOULD BE DELIBERATE</p>
              <h2>Build it with intelligence, precision, and intent.</h2>
              <p>Establish your CareerNavIQ private office and bring every important career decision into focus.</p>
            </div>
            <Link href="/register" className="landing-button landing-button-light">Request private access <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div>
            <Link href="/" className="landing-brand landing-footer-brand">
              <CompassMark className="landing-compass-small" />
              <span className="landing-wordmark">
                <span className="landing-word-career">Career</span>
                <span className="landing-word-nav">Nav</span>
                <span className="landing-word-iq">IQ</span>
              </span>
            </Link>
            <p>Private intelligence for a career built with intent.</p>
          </div>
          <div className="landing-footer-links">
            <Link href="/login">Member access</Link>
            <Link href="/register">Request access</Link>
            <span>CareerNavIQ.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
