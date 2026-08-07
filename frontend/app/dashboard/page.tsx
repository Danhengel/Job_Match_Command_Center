"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MetricStrip, Notice, SectionHeader } from "@/components/ui";
import { api } from "@/lib/api";

type Activity = { label: string; detail?: string; created_at?: string };
type DashboardData = {
  user_name?: string;
  average_completeness?: number;
  resume_count?: number;
  analyzed_resumes?: number;
  high_match_count?: number;
  application_count?: number;
  interview_count?: number;
  offer_count?: number;
  tailored_resume_count?: number;
  followups_due?: number;
  status_counts?: Record<string, number>;
  recent_activity?: Activity[];
};
type DigestData = { unread_count?: number; high_matches?: number; saved_search_updates?: number; follow_ups_due?: number };
type Interview = { id: number; application_id: number; title: string; event_type: string; starts_at: string; completed: boolean };
type Recruiter = { id: number; name: string; company: string; next_follow_up_at: string | null; last_contact_at: string | null; relationship_score: number };
type SearchRun = { id: number; unique_count: number; matched_count: number; created_at: string };
type Application = { id: number; status: string; created_at?: string; updated_at?: string; job: { title: string; company: string } };
type Goals = { applications: number; recruiterFollowups: number; mockInterviews: number };

const defaultGoals: Goals = { applications: 12, recruiterFollowups: 5, mockInterviews: 2 };
const stageOrder = ["wishlist", "applied", "recruiter", "interview", "final", "offer", "accepted"];
const stageLabels: Record<string, string> = {
  wishlist: "Selected",
  applied: "Applied",
  recruiter: "Recruiter",
  interview: "Interview",
  final: "Final",
  offer: "Offer",
  accepted: "Accepted",
};

function startOfWeek() {
  const date = new Date();
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function safeDate(value?: string | null) {
  return value ? new Date(value) : null;
}

function percent(value: number, target: number) {
  return Math.min(100, Math.round((value / Math.max(1, target)) * 100));
}

function daysUntil(value: string) {
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [searches, setSearches] = useState<SearchRun[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [practiceCount, setPracticeCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("careeros-command-goals");
      if (saved) setGoals({ ...defaultGoals, ...JSON.parse(saved) });
      const practice = JSON.parse(localStorage.getItem("careeros-interview-history") || "[]");
      setPracticeCount(
        Array.isArray(practice)
          ? practice.filter((item: { created_at?: string }) => (safeDate(item.created_at)?.getTime() || 0) >= startOfWeek().getTime()).length
          : 0,
      );
    } catch {
      // Local preferences are optional.
    }

    let active = true;
    (async () => {
      try {
        const [dashboard, interviewData, recruiterData, searchData, appData] = await Promise.all([
          api("/api/dashboard"),
          api("/api/recruiting/interviews").catch(() => []),
          api("/api/recruiting/recruiters").catch(() => []),
          api("/api/jobs/history").catch(() => []),
          api("/api/applications").catch(() => ({ applications: [] })),
        ]);
        if (!active) return;
        setData(dashboard);
        setInterviews(interviewData || []);
        setRecruiters(recruiterData || []);
        setSearches(searchData || []);
        setApplications(appData.applications || []);
        try {
          setDigest(await api("/api/automation/digest"));
        } catch {
          setDigest(null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load the command center.");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const computed = useMemo(() => {
    const week = startOfWeek().getTime();
    const now = Date.now();
    const upcoming = interviews
      .filter((item) => !item.completed && new Date(item.starts_at).getTime() >= now)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const dueRecruiters = recruiters.filter((item) => item.next_follow_up_at && new Date(item.next_follow_up_at).getTime() <= now);
    const applicationsThisWeek = applications.filter((item) => (safeDate(item.created_at || item.updated_at)?.getTime() || 0) >= week).length;
    const recruiterTouches = recruiters.filter((item) => (safeDate(item.last_contact_at)?.getTime() || 0) >= week).length;
    const latestSearch = searches[0];
    const stages = data?.status_counts || {};
    const applicationsCount = data?.application_count || applications.length;
    const interviewCount = data?.interview_count || 0;
    const offers = data?.offer_count || 0;
    const responseRate = applicationsCount
      ? Math.round((((stages.recruiter || 0) + (stages.interview || 0) + (stages.final || 0) + (stages.offer || 0) + (stages.accepted || 0)) / applicationsCount) * 100)
      : 0;
    const interviewRate = applicationsCount ? Math.round((interviewCount / applicationsCount) * 100) : 0;
    const readinessParts = [
      Math.min(100, data?.average_completeness || 0),
      Math.min(100, (applicationsThisWeek / Math.max(1, goals.applications)) * 100),
      Math.min(100, (recruiterTouches / Math.max(1, goals.recruiterFollowups)) * 100),
      upcoming.length ? 100 : 55,
      Math.min(100, (practiceCount / Math.max(1, goals.mockInterviews)) * 100),
      (data?.followups_due || dueRecruiters.length) === 0 ? 100 : 55,
    ];
    const momentum = Math.round(readinessParts.reduce((a, b) => a + b, 0) / readinessParts.length);
    return {
      upcoming,
      nextInterview: upcoming[0] || null,
      dueRecruiters,
      applicationsThisWeek,
      recruiterTouches,
      latestSearch,
      stages,
      applicationsCount,
      interviewCount,
      offers,
      responseRate,
      interviewRate,
      momentum,
    };
  }, [data, interviews, recruiters, searches, applications, goals, practiceCount]);

  function updateGoal(key: keyof Goals, value: number) {
    const next = { ...goals, [key]: Math.max(1, value) };
    setGoals(next);
    localStorage.setItem("careeros-command-goals", JSON.stringify(next));
  }

  if (error) {
    return <Notice title="Command center unavailable" tone="error"><p>{error}</p></Notice>;
  }

  if (!data) {
    return <section className="executive-loading"><p className="eyebrow">EXECUTIVE COMMAND CENTER</p><h2>Preparing your briefing…</h2></section>;
  }

  const firstName = data.user_name?.trim().split(/\s+/)[0] || "there";
  const highMatches = data.high_match_count ?? digest?.high_matches ?? 0;
  const followups = (data.followups_due || 0) + computed.dueRecruiters.length;
  const maxStage = Math.max(1, ...Object.values(computed.stages));
  const priorities = [
    ...(followups ? [{ title: `${followups} follow-up${followups === 1 ? "" : "s"} require attention`, detail: "Keep active opportunities and recruiter relationships moving.", href: "/crm", action: "Review relationships", urgency: "Due" }] : []),
    ...(computed.nextInterview ? [{ title: `Prepare for ${computed.nextInterview.title}`, detail: `${Math.max(0, daysUntil(computed.nextInterview.starts_at))} day${daysUntil(computed.nextInterview.starts_at) === 1 ? "" : "s"} until the conversation.`, href: "/interview-coach", action: "Open interview prep", urgency: "Upcoming" }] : []),
    ...(highMatches ? [{ title: `Review ${highMatches} high-alignment opportunit${highMatches === 1 ? "y" : "ies"}`, detail: "Compare the strongest current options against your executive mandate.", href: "/jobs", action: "Review market", urgency: "Market" }] : []),
  ];
  if (!priorities.length) {
    priorities.push({ title: "Refresh your market view", detail: "Scan for roles aligned with your current executive position.", href: "/jobs", action: "Open market intelligence", urgency: "Recommended" });
  }

  return (
    <>
      <section className="executive-command-hero">
        <div>
          <p className="eyebrow">EXECUTIVE COMMAND CENTER</p>
          <h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {firstName}.</h1>
          <p>Your current career momentum is <strong>{computed.momentum}%</strong>. The briefing below concentrates the decisions and actions that matter most today.</p>
          <div className="row wrap">
            <Link className="button" href={priorities[0].href}>{priorities[0].action}</Link>
            <Link className="button secondary" href="/jobs">Open market intelligence</Link>
          </div>
        </div>
        <div className="executive-momentum-score" aria-label={`Career momentum ${computed.momentum} percent`}>
          <span>Career momentum</span>
          <strong>{computed.momentum}</strong>
          <small>out of 100</small>
        </div>
      </section>

      <MetricStrip
        ariaLabel="Executive career metrics"
        items={[
          { label: "Active opportunities", value: computed.applicationsCount, detail: `${computed.applicationsThisWeek} added this week` },
          { label: "Response rate", value: `${computed.responseRate}%`, detail: "Recruiter response or later" },
          { label: "Interview rate", value: `${computed.interviewRate}%`, detail: `${computed.interviewCount} active interviews` },
          { label: "High-alignment roles", value: highMatches, detail: `${computed.latestSearch?.matched_count || 0} in latest review` },
          { label: "Offers", value: computed.offers, detail: "Offer and accepted stages" },
          { label: "Positioning readiness", value: `${data.average_completeness || 0}%`, detail: `${data.analyzed_resumes || 0} résumés reviewed` },
        ]}
      />

      <section className="executive-command-grid executive-command-grid-primary">
        <article className="executive-panel">
          <SectionHeader eyebrow="PRIORITY DECISIONS" title="What deserves your attention now" description="A concise view of the actions most likely to move your search forward." />
          <div className="executive-priority-list">
            {priorities.slice(0, 4).map((item, index) => (
              <div className="executive-priority-item" key={item.title}>
                <span className="executive-index">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <small>{item.urgency}</small>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </div>
                <Link className="button secondary compact" href={item.href}>{item.action}</Link>
              </div>
            ))}
          </div>
        </article>

        <article className="executive-panel executive-interview-brief">
          <SectionHeader eyebrow="NEXT INTERVIEW" title={computed.nextInterview ? computed.nextInterview.title : "No interview scheduled"} />
          {computed.nextInterview ? (
            <>
              <p className="executive-date">{new Date(computed.nextInterview.starts_at).toLocaleString()}</p>
              <div className="executive-countdown"><strong>{Math.max(0, daysUntil(computed.nextInterview.starts_at))}</strong><span>days to prepare</span></div>
              <div className="row wrap"><Link className="button" href="/interview-coach">Interview prep</Link><Link className="button secondary" href="/interviews">Interview advisory</Link></div>
            </>
          ) : (
            <><p className="muted">Interview preparation will appear here as opportunities advance.</p><Link className="button secondary" href="/interviews">Open interview advisory</Link></>
          )}
        </article>
      </section>

      <section className="executive-command-grid">
        <article className="executive-panel">
          <SectionHeader eyebrow="OPPORTUNITY PORTFOLIO" title="Movement by stage" description="A portfolio view of how selected opportunities are progressing." actions={<Link href="/applications">Open portfolio →</Link>} />
          <div className="executive-funnel">
            {stageOrder.map((stage, index) => {
              const count = computed.stages[stage] || 0;
              const previous = index ? computed.stages[stageOrder[index - 1]] || 0 : computed.applicationsCount;
              const conversion = previous ? Math.round((count / previous) * 100) : 0;
              return (
                <div className="executive-funnel-row" key={stage}>
                  <div><span>{stageLabels[stage]}</span><small>{index ? `${conversion}% from prior stage` : "Total tracked"}</small></div>
                  <div className="executive-progress-track"><div style={{ width: `${Math.max(count ? 8 : 0, (count / maxStage) * 100)}%` }} /></div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
        </article>

        <article className="executive-panel">
          <SectionHeader eyebrow="WEEKLY DISCIPLINE" title="Activity targets" description="A small set of controllable actions; stored only on this device." />
          {([
            ["applications", "Quality applications", computed.applicationsThisWeek],
            ["recruiterFollowups", "Relationship follow-ups", computed.recruiterTouches],
            ["mockInterviews", "Interview practice", practiceCount],
          ] as const).map(([key, label, value]) => (
            <div className="executive-goal-row" key={key}>
              <div className="row between"><span>{label}</span><label>{value} / <input type="number" min="1" value={goals[key]} onChange={(event) => updateGoal(key, Number(event.target.value))} /></label></div>
              <div className="executive-progress-track"><div style={{ width: `${percent(Number(value), goals[key])}%` }} /></div>
            </div>
          ))}
        </article>
      </section>

      <section className="executive-panel executive-action-panel">
        <SectionHeader eyebrow="EXECUTIVE WORKSPACE" title="Move directly to the work that matters" />
        <div className="executive-action-grid-v6">
          <Link href="/jobs"><strong>Market intelligence</strong><span>Evaluate current opportunities and market fit.</span></Link>
          <Link href="/applications"><strong>Opportunity portfolio</strong><span>Manage active pursuits, stages, and decisions.</span></Link>
          <Link href="/resumes/studio"><strong>Positioning studio</strong><span>Sharpen executive evidence for a specific role.</span></Link>
          <Link href="/crm"><strong>Relationship network</strong><span>Keep recruiter and hiring relationships moving.</span></Link>
          <Link href="/interview-coach"><strong>Interview preparation</strong><span>Strengthen stories, questions, and executive presence.</span></Link>
          <Link href="/analytics"><strong>Performance intelligence</strong><span>Read response patterns and adjust strategy.</span></Link>
        </div>
      </section>
    </>
  );
}
