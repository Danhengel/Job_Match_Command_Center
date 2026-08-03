"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { EmptyState, Notice, ProgressBar, StatCard } from "@/components/ui";

type DashboardData = {
  user_name: string;
  resume_count: number;
  ready_profiles: number;
  analyzed_resumes: number;
  average_completeness: number;
  job_match_count: number;
  high_match_count: number;
  application_count: number;
  interview_count: number;
  offer_count: number;
  tailored_resume_count: number;
  followups_due: number;
  status_counts: Record<string, number>;
  profiles: Array<{ id: number; name: string; completeness: number; resume_count: number; has_primary: boolean; best_resume_score: number }>;
};

type DigestData = {
  unread_count: number;
  high_matches: number;
  saved_search_updates: number;
  follow_ups_due: number;
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setError("");
      try {
        const dashboardData = await api("/api/dashboard");
        if (!active) return;
        setData(dashboardData);
        try {
          const digestData = await api("/api/automation/digest");
          if (active) setDigest(digestData);
        } catch {
          if (active) setDigest(null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load dashboard.");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const nextAction = useMemo(() => {
    if (!data) return null;
    if (!data.ready_profiles) return { title: "Complete your career profile", detail: "Add your goals and a primary résumé so CareerOS can rank opportunities accurately.", href: "/profiles", button: "Build my profile" };
    if (!data.analyzed_resumes) return { title: "Review your résumé intelligence", detail: "Analyze your résumé to confirm skills, achievements, and recommended career paths.", href: "/resumes", button: "Review résumé" };
    if (!data.high_match_count) return { title: "Run a smart job search", detail: "Search current opportunities and focus on jobs with the strongest evidence-based fit.", href: "/jobs", button: "Find jobs" };
    if (!data.application_count) return { title: "Choose your first application", detail: `You have ${data.high_match_count} strong matches ready for review.`, href: "/jobs", button: "Review matches" };
    if (data.followups_due) return { title: "Complete your follow-ups", detail: `${data.followups_due} application${data.followups_due === 1 ? " needs" : "s need"} attention today.`, href: "/applications", button: "Open pipeline" };
    if (data.interview_count) return { title: "Prepare for your upcoming interview", detail: `${data.interview_count} interview${data.interview_count === 1 ? " is" : "s are"} currently scheduled.`, href: "/interviews", button: "Prepare now" };
    return { title: "Review your strongest opportunities", detail: "Keep your search moving by reviewing new matches and updating application statuses.", href: "/jobs", button: "Continue" };
  }, [data]);

  if (error) {
    return <Notice title="Dashboard unavailable" tone="error"><p>{error}</p><Link className="button secondary" href="/login">Sign in again</Link></Notice>;
  }

  if (!data || !nextAction) {
    return <section className="card"><p className="eyebrow">CAREEROS</p><h2>Loading your dashboard…</h2><p className="muted">Pulling your profile, job matches, applications, and interview activity.</p></section>;
  }

  const firstName = data.user_name?.trim().split(/\s+/)[0] || "there";
  const stageEntries = Object.entries(data.status_counts || {}).filter(([, count]) => count > 0);

  return (
    <>
      <section className="dashboard-hero-modern">
        <div>
          <p className="eyebrow">YOUR CAREER COMMAND CENTER</p>
          <h1>Welcome back, {firstName}</h1>
          <p className="muted">CareerOS keeps your profile, opportunities, applications, and interviews moving in one logical workflow.</p>
        </div>
        <div className="page-header-actions">
          <Link className="button" href={nextAction.href}>{nextAction.button}</Link>
          <Link className="button secondary" href="/jobs">Search jobs</Link>
        </div>
      </section>

      <section className="dashboard-focus-grid">
        <article className="next-action-card">
          <p className="eyebrow">RECOMMENDED NEXT STEP</p>
          <h2>{nextAction.title}</h2>
          <p className="muted">{nextAction.detail}</p>
          <Link className="button" href={nextAction.href}>{nextAction.button}</Link>
        </article>
        <article className="career-progress-card">
          <p className="eyebrow">PROFILE READINESS</p>
          <h2>{data.average_completeness}% complete</h2>
          <ProgressBar value={data.average_completeness} label="Career profile" />
          <p className="muted">A complete profile improves search expansion, ranking, and tailored application quality.</p>
          <Link className="button secondary" href="/profiles">Review profile</Link>
        </article>
      </section>

      <section className="stat-grid" aria-label="Career activity">
        <StatCard label="Strong job matches" value={data.high_match_count} detail={`${data.job_match_count} total ranked jobs`} />
        <StatCard label="Applications" value={data.application_count} detail="Tracked opportunities" />
        <StatCard label="Interviews" value={data.interview_count} detail="Scheduled or final stage" />
        <StatCard label="Follow-ups due" value={data.followups_due} detail="Actions needing attention" />
      </section>

      {digest ? (
        <Notice title={`${digest.unread_count} items in your daily briefing`} tone={digest.follow_ups_due ? "warning" : "info"}>
          <p>{digest.high_matches} high matches • {digest.follow_ups_due} follow-ups • {digest.saved_search_updates} saved-search updates</p>
          <Link className="button secondary" href="/notifications">Open briefing</Link>
        </Notice>
      ) : null}

      <section className="two-col">
        <section className="card">
          <div className="row between">
            <div><p className="eyebrow">APPLICATION PIPELINE</p><h2>Where opportunities stand</h2></div>
            <Link className="button secondary" href="/applications">Manage pipeline</Link>
          </div>
          {stageEntries.length ? (
            <div className="dashboard-funnel-list">
              {stageEntries.map(([stage, count]) => <div className="dashboard-funnel-row" key={stage}><span>{stage.replaceAll("_", " ")}</span><strong>{count}</strong></div>)}
            </div>
          ) : (
            <EmptyState title="No applications yet" description="Save a strong match to begin tracking your job search." action={<Link className="button" href="/jobs">Review job matches</Link>} />
          )}
        </section>

        <section className="card">
          <p className="eyebrow">CAREER JOURNEY</p>
          <h2>Keep moving forward</h2>
          <div className="dashboard-action-grid">
            <Link className="dashboard-action-card" href="/profiles"><strong>1. Build profile</strong><span>Confirm goals, skills, and preferences</span></Link>
            <Link className="dashboard-action-card" href="/jobs"><strong>2. Discover jobs</strong><span>Search and rank current opportunities</span></Link>
            <Link className="dashboard-action-card" href="/coach"><strong>3. Prepare application</strong><span>Tailor your résumé and outreach</span></Link>
            <Link className="dashboard-action-card" href="/applications"><strong>4. Apply and track</strong><span>Manage stages and next actions</span></Link>
            <Link className="dashboard-action-card" href="/interviews"><strong>5. Interview</strong><span>Prepare answers and follow up</span></Link>
          </div>
        </section>
      </section>
    </>
  );
}
