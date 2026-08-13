import Link from "next/link";
import type { PublicPageData } from "@/lib/publicPages";

const SITE_URL = "https://careernaviq.com";

const secondaryLinks: Record<string, string> = {
  features: "/ai-job-search",
  about: "/features",
  pricing: "/features",
  contact: "/privacy",
  "ai-job-search": "/features",
  "job-application-tracker": "/features",
  "resume-optimizer": "/job-application-tracker",
  "interview-preparation": "/job-application-tracker",
  privacy: "/terms",
  terms: "/privacy",
};

function CompassMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`public-compass${compact ? " public-compass-compact" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" role="img">
        <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="4" />
        <path d="M40.5 23.5 35 35l-11.5 5.5L29 29l11.5-5.5Z" fill="currentColor" />
        <circle cx="32" cy="32" r="3.5" fill="white" />
        <path d="M32 2v7M32 55v7M2 32h7M55 32h7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function Wordmark() {
  return (
    <span className="public-wordmark" aria-label="CareerNavIQ">
      <span>Career</span><span>Nav</span><span>IQ</span>
    </span>
  );
}

function PublicHeader() {
  return (
    <header className="public-header">
      <div className="public-container public-header-inner">
        <Link href="/" className="public-brand" aria-label="CareerNavIQ home">
          <CompassMark compact />
          <Wordmark />
        </Link>
        <nav className="public-nav" aria-label="Public navigation">
          <Link href="/features">Features</Link>
          <Link href="/ai-job-search">AI job search</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/register" className="public-nav-cta">Get started</Link>
        </nav>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="public-container public-footer-grid">
        <div>
          <Link href="/" className="public-brand public-footer-brand">
            <CompassMark compact />
            <Wordmark />
          </Link>
          <p>Find opportunities. Track progress. Achieve more.</p>
        </div>
        <div>
          <strong>Platform</strong>
          <Link href="/features">Features</Link>
          <Link href="/ai-job-search">AI job search</Link>
          <Link href="/job-application-tracker">Application tracker</Link>
          <Link href="/resume-optimizer">Resume optimizer</Link>
          <Link href="/interview-preparation">Interview preparation</Link>
        </div>
        <div>
          <strong>Company</strong>
          <Link href="/about">About</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
        <div>
          <strong>Account</strong>
          <Link href="/login">Sign in</Link>
          <Link href="/register">Create account</Link>
          <span>CareerNavIQ.com</span>
        </div>
      </div>
      <div className="public-container public-footer-bottom">
        <span>© {new Date().getFullYear()} CareerNavIQ. All rights reserved.</span>
        <nav aria-label="Legal navigation"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></nav>
        <span>Career-management tools do not guarantee employment outcomes.</span>
      </div>
    </footer>
  );
}

export function PublicPage({ page }: { page: PublicPageData }) {
  const canonicalUrl = `${SITE_URL}/${page.slug}`;
  const structuredData: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: page.title,
      description: page.description,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#application` },
      inLanguage: "en-US",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "CareerNavIQ",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: page.title,
          item: canonicalUrl,
        },
      ],
    },
  ];

  if (page.faqs?.length) {
    structuredData.push({
      "@type": "FAQPage",
      mainEntity: page.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  return (
    <div className="public-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ "@context": "https://schema.org", "@graph": structuredData }),
        }}
      />
      <PublicHeader />
      <main>
        <section className={`public-hero${page.policy ? " public-policy-hero" : ""}`}>
          <div className="public-container public-hero-inner">
            <nav className="public-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <span>{page.slug.replaceAll("-", " ")}</span>
            </nav>
            <p className="public-eyebrow">{page.eyebrow}</p>
            <h1>{page.title}</h1>
            <p className="public-intro">{page.intro}</p>
            {page.updated ? <p className="public-updated">Last updated: {page.updated}</p> : null}
            {!page.policy ? (
              <div className="public-hero-actions">
                <Link href="/register" className="public-button public-button-primary">
                  {page.primaryCta ?? "Create my account"}<span aria-hidden="true">→</span>
                </Link>
                {page.secondaryCta ? (
                  <Link href={secondaryLinks[page.slug] ?? "/features"} className="public-button public-button-secondary">
                    {page.secondaryCta}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        {page.cards?.length ? (
          <section className="public-card-section">
            <div className="public-container public-card-grid">
              {page.cards.map((card) => (
                <article key={card.title} className="public-card">
                  {card.icon ? <span className="public-card-icon" aria-hidden="true">{card.icon}</span> : null}
                  <h2>{card.title}</h2>
                  <p>{card.description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className={`public-content-section${page.policy ? " public-policy-content" : ""}`}>
          <div className="public-container public-content-layout">
            {!page.policy ? (
              <aside className="public-content-aside">
                <p className="public-eyebrow">A BETTER CAREER WORKFLOW</p>
                <h2>Turn information into the next useful action.</h2>
                <p>CareerNavIQ connects career research, materials, relationships, and follow-through so each step supports the next.</p>
                <Link href="/features">Explore the platform <span aria-hidden="true">→</span></Link>
              </aside>
            ) : null}
            <div className="public-content-main">
              {page.sections.map((section) => (
                <article key={section.title} className="public-content-block">
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.bullets?.length ? (
                    <ul>
                      {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        {page.faqs?.length ? (
          <section className="public-faq-section">
            <div className="public-container public-faq-layout">
              <div>
                <p className="public-eyebrow">COMMON QUESTIONS</p>
                <h2>What to know before you begin</h2>
              </div>
              <div className="public-faq-list">
                {page.faqs.map((faq) => (
                  <details key={faq.question}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="public-related-section">
          <div className="public-container">
            <p className="public-eyebrow">KEEP EXPLORING</p>
            <h2>Build a connected career-search system</h2>
            <div className="public-related-grid">
              <Link href="/ai-job-search"><strong>AI job search</strong><span>Find and prioritize stronger-fit opportunities.</span></Link>
              <Link href="/job-application-tracker"><strong>Application tracker</strong><span>Organize every stage and next action.</span></Link>
              <Link href="/resume-optimizer"><strong>Resume optimizer</strong><span>Tailor positioning around accurate evidence.</span></Link>
              <Link href="/interview-preparation"><strong>Interview preparation</strong><span>Prepare stories, questions, and follow-ups.</span></Link>
            </div>
          </div>
        </section>

        <section className="public-final-cta">
          <div className="public-container public-final-card">
            <CompassMark />
            <div>
              <p className="public-eyebrow">YOUR NEXT OPPORTUNITY STARTS WITH A BETTER SYSTEM</p>
              <h2>{page.policy ? "Review the platform before creating an account." : "Take control of every step in your career search."}</h2>
              <p>{page.policy ? "Explore CareerNavIQ's features, current early-access model, and related policies." : "Bring opportunities, resumes, applications, contacts, interviews, and insights into one workspace."}</p>
            </div>
            <div className="public-final-actions">
              <Link href={page.policy ? secondaryLinks[page.slug] : "/register"} className="public-button public-button-light">
                {page.policy ? page.secondaryCta : "Create my account"}<span aria-hidden="true">→</span>
              </Link>
              {page.policy ? <Link href="/features" className="public-final-text-link">View features</Link> : null}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
