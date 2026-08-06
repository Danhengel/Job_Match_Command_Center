import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CareerNavIQ | Navigate your next career move",
  description:
    "Find stronger-fit opportunities, tailor your resume, track applications, and prepare for interviews in one intelligent career workspace.",
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
            <a href="#features">Features</a>
            <Link href="/login">Sign in</Link>
            <Link href="/register" className="landing-nav-cta">Get started</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow">YOUR AI-POWERED CAREER WORKSPACE</p>
              <h1>Navigate your next career move with confidence.</h1>
              <p className="landing-hero-lead">
                CareerNavIQ brings job discovery, resume optimization, application tracking,
                interview preparation, and career insights into one clear command center.
              </p>

              <div className="landing-hero-actions">
                <Link href="/register" className="landing-button landing-button-primary">
                  Build my career command center
                  <span aria-hidden="true">→</span>
                </Link>
                <a href="#how-it-works" className="landing-button landing-button-secondary">
                  See how it works
                </a>
              </div>

              <div className="landing-proof-row" aria-label="CareerNavIQ benefits">
                <span><CheckIcon /> One organized workspace</span>
                <span><CheckIcon /> Personalized career direction</span>
                <span><CheckIcon /> Built for every step</span>
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
                  <span className="landing-preview-label">Illustrative preview</span>
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
                        <small>YOUR CAREER COMMAND CENTER</small>
                        <strong>Your personalized dashboard</strong>
                      </div>
                      <span>3 actions today</span>
                    </div>

                    <div className="landing-preview-stats">
                      <div><small>Strong matches</small><strong>12</strong><span>Illustrative count</span></div>
                      <div><small>Applications</small><strong>5</strong><span>1 needs follow-up</span></div>
                      <div><small>Interviews</small><strong>2</strong><span>Preparation ready</span></div>
                    </div>

                    <div className="landing-preview-grid">
                      <section className="landing-preview-card landing-preview-priority">
                        <div className="landing-card-heading">
                          <div><small>NEXT BEST ACTION</small><strong>Complete your target role profile</strong></div>
                          <span>72%</span>
                        </div>
                        <p>Sharper preferences improve your matches and recommendations.</p>
                        <div className="landing-progress"><span /></div>
                        <button type="button" tabIndex={-1}>Continue setup</button>
                      </section>

                      <section className="landing-preview-card">
                        <div className="landing-card-heading">
                          <div><small>TOP OPPORTUNITIES</small><strong>Illustrative strong-fit roles</strong></div>
                          <span className="landing-green-pill">Demo</span>
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
              <div><h2>Find opportunities</h2><p>Focus on roles aligned with your experience, goals, location, and preferences.</p></div>
            </article>
            <article>
              <span className="landing-value-number">02</span>
              <div><h2>Track progress</h2><p>Manage applications, contacts, interviews, follow-ups, and deadlines in one place.</p></div>
            </article>
            <article>
              <span className="landing-value-number">03</span>
              <div><h2>Achieve more</h2><p>Strengthen your resume, prepare better answers, and make smarter career decisions.</p></div>
            </article>
          </div>
        </section>

        <section id="how-it-works" className="landing-section landing-how">
          <div className="landing-container">
            <div className="landing-section-heading">
              <p className="landing-eyebrow">A CLEARER WAY FORWARD</p>
              <h2>From scattered job search to focused career strategy.</h2>
              <p>CareerNavIQ organizes the journey into five connected steps, so you always know what to do next.</p>
            </div>

            <div className="landing-steps">
              <article><span>1</span><h3>Build your profile</h3><p>Bring your experience, strengths, goals, and preferences into one career profile.</p></article>
              <article><span>2</span><h3>Discover matches</h3><p>Search and prioritize opportunities that fit where you want to go next.</p></article>
              <article><span>3</span><h3>Tailor and prepare</h3><p>Strengthen your resume, outreach, and positioning for each opportunity.</p></article>
              <article><span>4</span><h3>Apply and track</h3><p>Keep every application, contact, deadline, and follow-up moving forward.</p></article>
              <article><span>5</span><h3>Interview and improve</h3><p>Prepare evidence-backed stories and use insights to sharpen your strategy.</p></article>
            </div>
          </div>
        </section>

        <section id="features" className="landing-section landing-features-section">
          <div className="landing-container landing-features-layout">
            <div className="landing-feature-intro">
              <p className="landing-eyebrow">EVERYTHING IN ONE PLACE</p>
              <h2>Your complete career operating system—without the clutter.</h2>
              <p>
                Stop juggling job boards, spreadsheets, documents, notes, and calendar reminders.
                CareerNavIQ connects the work so each action supports the next.
              </p>
              <Link href="/register" className="landing-text-link">Create your workspace <span aria-hidden="true">→</span></Link>
            </div>

            <div className="landing-feature-grid">
              <article><span aria-hidden="true">⌕</span><h3>Smart job search</h3><p>Discover and compare opportunities using the criteria that matter to you.</p></article>
              <article><span aria-hidden="true">✦</span><h3>Resume studio</h3><p>Translate your experience into stronger, role-specific positioning.</p></article>
              <article><span aria-hidden="true">✓</span><h3>Application pipeline</h3><p>See every application stage, priority, deadline, and next action.</p></article>
              <article><span aria-hidden="true">◎</span><h3>Interview preparation</h3><p>Build stories, practice questions, and prepare focused talking points.</p></article>
              <article><span aria-hidden="true">◇</span><h3>Recruiter CRM</h3><p>Organize the people, conversations, and follow-ups behind your search.</p></article>
              <article><span aria-hidden="true">↗</span><h3>Career insights</h3><p>Use your activity and outcomes to make better decisions over time.</p></article>
            </div>
          </div>
        </section>

        <section className="landing-final-cta">
          <div className="landing-container landing-final-card">
            <CompassMark className="landing-final-compass" />
            <div>
              <p className="landing-eyebrow">YOUR NEXT OPPORTUNITY STARTS WITH A BETTER SYSTEM</p>
              <h2>Turn your experience into the right next opportunity.</h2>
              <p>Create your CareerNavIQ workspace and take control of every step in your career search.</p>
            </div>
            <Link href="/register" className="landing-button landing-button-light">Create my account <span aria-hidden="true">→</span></Link>
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
            <p>Find opportunities. Track progress. Achieve more.</p>
          </div>
          <div className="landing-footer-links">
            <Link href="/login">Sign in</Link>
            <Link href="/register">Create account</Link>
            <span>CareerNavIQ.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
