import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CareerNavIQ | Intelligent career navigation",
  description:
    "An intelligent career-navigation system that connects your direction, opportunities, applications, and next moves.",
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
            <a href="#how-it-works">How it works</a>
            <a href="#features">Navigation tools</a>
            <Link href="/login">Sign in</Link>
            <Link href="/register" className="landing-nav-cta">Start navigating</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow">INTELLIGENT CAREER NAVIGATION</p>
              <h1>A clearer route to what’s next.</h1>
              <p className="landing-hero-lead">
                CareerNavIQ connects your goals, experience, opportunities, and progress
                in one guided system—so you can see where you are and choose the right next move.
              </p>

              <div className="landing-hero-actions">
                <Link href="/register" className="landing-button landing-button-primary">
                  Map my next move
                  <span aria-hidden="true">→</span>
                </Link>
                <a href="#how-it-works" className="landing-button landing-button-secondary">
                  See how it works
                </a>
              </div>

              <div className="landing-proof-row" aria-label="CareerNavIQ benefits">
                <span><CheckIcon /> Direction built around you</span>
                <span><CheckIcon /> Every next step connected</span>
                <span><CheckIcon /> Private by design</span>
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
                  <span className="landing-preview-label">Navigation preview</span>
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
                        <small>TODAY’S ROUTE</small>
                        <strong>Your next best move</strong>
                      </div>
                      <span>3 waypoints ahead</span>
                    </div>

                    <div className="landing-preview-stats">
                      <div><small>Strong routes</small><strong>12</strong><span>Matched opportunities</span></div>
                      <div><small>In progress</small><strong>5</strong><span>1 waypoint due</span></div>
                      <div><small>Interviews</small><strong>2</strong><span>Preparation ready</span></div>
                    </div>

                    <div className="landing-route-map" aria-hidden="true">
                      <svg viewBox="0 0 480 80" preserveAspectRatio="none">
                        <path className="landing-route-contour contour-one" d="M8 66C72 12 120 20 166 49s102 27 143-7 93-28 163 12" />
                        <path className="landing-route-contour contour-two" d="M15 76C79 28 125 35 169 60s99 21 144-8 96-20 155 12" />
                        <path className="landing-route-line" d="M18 57C86 57 91 20 159 27s83 36 146 23 91-39 155-19" />
                        <circle cx="18" cy="57" r="5" />
                        <circle cx="159" cy="27" r="5" />
                        <circle cx="305" cy="50" r="5" />
                        <circle className="landing-route-destination" cx="460" cy="31" r="7" />
                      </svg>
                      <span>Direction set</span>
                      <strong>Next waypoint: refine target roles</strong>
                    </div>

                    <div className="landing-preview-grid">
                      <section className="landing-preview-card landing-preview-priority">
                        <div className="landing-card-heading">
                          <div><small>NEXT WAYPOINT</small><strong>Sharpen your target direction</strong></div>
                          <span>72%</span>
                        </div>
                        <p>A clear direction leads to stronger matches and more focused next moves.</p>
                        <div className="landing-progress"><span /></div>
                        <button type="button" tabIndex={-1}>Continue route</button>
                      </section>

                      <section className="landing-preview-card">
                        <div className="landing-card-heading">
                          <div><small>ROUTE OPTIONS</small><strong>Best-fit opportunities</strong></div>
                          <span className="landing-green-pill">Updated</span>
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
              <div><h2>Set your direction</h2><p>Turn your experience, strengths, and goals into a clear career compass.</p></div>
            </article>
            <article>
              <span className="landing-value-number">02</span>
              <div><h2>Explore the landscape</h2><p>Compare roles, employers, and possible routes against what matters to you.</p></div>
            </article>
            <article>
              <span className="landing-value-number">03</span>
              <div><h2>Move waypoint to waypoint</h2><p>Keep applications, relationships, interviews, and next actions moving forward.</p></div>
            </article>
          </div>
        </section>

        <section id="how-it-works" className="landing-section landing-how">
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-eyebrow">ONE CONNECTED ROUTE FORWARD</p>
              <h2>From scattered activity to a path you can follow.</h2>
              <p>CareerNavIQ turns career progress into five connected stages, with clear direction at every point.</p>
            </div>

            <div className="landing-steps">
              <article><span>1</span><h3>Set your direction</h3><p>Clarify the roles, goals, strengths, and conditions that define your next move.</p></article>
              <article><span>2</span><h3>Explore possible routes</h3><p>Find opportunities and employers that align with the direction you chose.</p></article>
              <article><span>3</span><h3>Prepare each move</h3><p>Tailor your résumé, story, and outreach for the route in front of you.</p></article>
              <article><span>4</span><h3>Track your waypoints</h3><p>Keep every application, contact, deadline, and next action clearly marked.</p></article>
              <article><span>5</span><h3>Navigate the interview</h3><p>Prepare your evidence, practice the conversation, and move forward with confidence.</p></article>
            </div>
          </div>
        </section>

        <section id="features" className="landing-section landing-features-section">
          <div className="landing-container landing-features-layout">
            <div className="landing-feature-intro">
              <p className="landing-eyebrow">YOUR CAREER NAVIGATION SYSTEM</p>
              <h2>Everything you need to find and follow your route.</h2>
              <p>
                Bring your direction, opportunities, materials, relationships, and progress
                into one clear view, with every next move connected.
              </p>
              <Link href="/register" className="landing-text-link">Start your route <span aria-hidden="true">→</span></Link>
            </div>

            <div className="landing-feature-grid">
              <article><span aria-hidden="true">⌖</span><h3>Career compass</h3><p>Define the roles, goals, strengths, and preferences guiding your next move.</p></article>
              <article><span aria-hidden="true">◇</span><h3>Opportunity map</h3><p>Find and compare routes that fit your experience and direction.</p></article>
              <article><span aria-hidden="true">↗</span><h3>Route builder</h3><p>Shape your résumé, story, and outreach for each opportunity.</p></article>
              <article><span aria-hidden="true">●</span><h3>Waypoint tracker</h3><p>See every application, deadline, contact, and next action in context.</p></article>
              <article><span aria-hidden="true">◎</span><h3>Interview navigation</h3><p>Prepare stories, questions, and talking points for the next conversation.</p></article>
              <article><span aria-hidden="true">△</span><h3>Progress signals</h3><p>Use patterns and outcomes to adjust your direction and keep moving.</p></article>
            </div>
          </div>
        </section>

        <section className="landing-final-cta">
          <div className="landing-container landing-final-card">
            <CompassMark className="landing-final-compass" />
            <div>
              <p className="landing-eyebrow">YOUR NEXT MOVE STARTS WITH DIRECTION</p>
              <h2>Set the destination. Map the way forward.</h2>
              <p>Build your CareerNavIQ route and bring every important career move into one clear path.</p>
            </div>
            <Link href="/register" className="landing-button landing-button-light">Start navigating <span aria-hidden="true">→</span></Link>
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
            <p>Intelligent navigation for every career move.</p>
          </div>
          <div className="landing-footer-links">
            <Link href="/login">Sign in</Link>
            <Link href="/register">Start navigating</Link>
            <span>CareerNavIQ.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
