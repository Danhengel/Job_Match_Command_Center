import Link from "next/link";

export default function Home(){
 return <div className="public-page">
  <nav className="row between wrap"><strong className="public-brand">CareerOS</strong><div className="row wrap"><Link href="/help">Help</Link><Link href="/login">Sign in</Link><Link className="button" href="/register">Join private beta</Link></div></nav>
  <section className="executive-hero"><div><p className="eyebrow">YOUR CAREER COMMAND CENTER</p><h1>Find opportunities. Track progress. Achieve more.</h1><p className="muted">CareerOS brings job discovery, résumé tailoring, application tracking, recruiter follow-up, interview preparation, analytics, and automation into one focused workspace.</p><div className="row wrap"><Link className="button" href="/register">Start your workspace</Link><Link className="button secondary" href="/login">Sign in</Link></div></div><div className="card"><h2>Built for an active search</h2><p>Daily priorities, high-match opportunities, follow-up reminders, interview preparation, and weekly reporting are grounded in the activity you record.</p></div></section>
  <section className="executive-metrics-grid"><article className="card"><h3>Discover</h3><p>Run targeted searches and save recurring search strategies.</p></article><article className="card"><h3>Prepare</h3><p>Tailor résumés, outreach, and interview stories to each role.</p></article><article className="card"><h3>Track</h3><p>Manage applications, recruiters, interviews, and next actions.</p></article><article className="card"><h3>Automate</h3><p>Receive in-app reminders, daily briefs, and weekly reports.</p></article></section>
  <footer className="row between wrap"><span>CareerOS private beta</span><div className="row wrap"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/contact">Contact</Link></div></footer>
 </div>;
}
