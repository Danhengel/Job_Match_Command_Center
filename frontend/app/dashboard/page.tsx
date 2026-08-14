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
  wishlist: "Saved",
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
        if (active) setError(err instanceof Error ? err.message : "Unable to load your home page.");
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
      momentum,
    };
  }, [data, interviews, recruiters, searches, applications, goals, practiceCount]);

  function updateGoal(key: keyof Goals, value: number) {
    const next = { ...goals, [key]: Math.max(1, value) };
    setGoals(next);
    localStorage.setItem("careeros-command-goals", JSON.stringify(next));
  }

  if (error) {
    return <Notice title="Home page unavailable" tone="error"><p>{error}</p></Notice>;
  }

  if (!data) {
    return <section className="executive-loading"><p className="eyebrow">HOME</p><h2>Loading your next steps…</h2></section>;
  }

  const firstName = data.user_name?.trim().split(/\s+/)[0] || "there";
  const highMatches = data.high_match_count ?? digest?.high_matches ?? 0;
  const followups = (data.followups_due || 0) + computed.dueRecruiters.length;
  const maxStage = Math.max(1, ...Object.values(computed.stages));
  const priorities = [
    ...(followups ? [{ title: `${followups} follow-up${followups === 1 ? "" : "s"} need attention`, detail: "Review contacts and active applications that are waiting on a next step.", href: "/crm", action: "Review follow-ups", urgency: "Due" }] : []),
    ...(computed.nextInterview ? [{ title: `Prepare for ${computed.nextInterview.title}`, detail: `${Math.max(0, daysUntil(computed.nextInterview.starts_at))} day${daysUntil(computed.nextInterview.starts_at) === 1 ? "" : "s"} until the interview.`, href: "/interview-coach", action: "Prepare now", urgency: "Upcoming" }] : []),
    ...(highMatches ? [{ title: `Review ${highMatches} strong job match${highMatches === 1 ? "" : "es"}`, detail: "Open the best current roles and decide which are worth pursuing.", href: "/jobs", action: "Review jobs", urgency: "Jobs" }] : []),
  ];
  if (!priorities.length) {
    priorities.push({ title: "Find your next matching role", detail: "Search current jobs using the target and preferences in your profile.", href: "/jobs", action: "Find Jobs", urgency: "Recommended" });
  }

  const nextMoves = [
    {
      title: highMatches ? `${highMatches} job match${highMatches === 1 ? "" : "es"} to review` : "Find matching jobs",
      detail: highMatches ? "Start with the roles that best fit your profile." : "Search for roles that fit your target and preferences.",
      href: "/jobs",
    },
    {
      title: followups ? `${followups} application follow-up${followups === 1 ? "" : "s"}` : "Review your applications",
      detail: followups ? "Keep active opportunities moving before they go quiet." : "Check statuses, decisions, and next actions in one place.",
      href: followups ? "/crm" : "/applications",
    },
    {
      title: computed.nextInterview ? `Prepare for ${computed.nextInterview.title}` : "Get ready for interviews",
      detail: computed.nextInterview ? `${Math.max(0, daysUntil(computed.nextInterview.starts_at))} day${daysUntil(computed.nextInterview.starts_at) === 1 ? "" : "s"} remaining to prepare.` : "Build stronger stories and practice before an interview is scheduled.",
      href: computed.nextInterview ? "/interview-coach" : "/interviews",
    },
  ];

  return (
    <>
      <section className="executive-command-hero">
        <div>
          <p className="eyebrow">HOME</p>
          <h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {firstName}.</h1>
          <p>Here are the actions most likely to move your search forward today.</p>
          <div className="row wrap">
            <Link className="button" href={priorities[0].href}>{priorities[0].action}</Link>
          </div>
        </div>
        <div className="executive-momentum-score" aria-label={`Search momentum ${computed.momentum} percent`}>
          <span>Search momentum</span>
          <strong>{computed.momentum}</strong>
          <small>out of 100</small>
        </div>
      </section>

      <section className="executive-panel executive-action-panel">
        <SectionHeader eyebrow="START HERE" title="Your next three moves" description="The most useful actions based on your current jobs, applications, and interviews." />
        <div className="executive-action-grid-v6">
          {nextMoves.map((item) => (
            <Link key={item.title} href={item.href}>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
            </Link>
          ))}
        </div>
      </section>

      <MetricStrip
        ariaLabel="Career search summary"
        items={[
          { label: "Applications", value: computed.applicationsCount, detail: `${computed.applicationsThisWeek} added this week` },
          { label: "Strong job matches", value: highMatches, detail: `${computed.latestSearch?.matched_count || 0} in the latest search` },
          { label: "Interviews", value: computed.interviewCount, detail: computed.nextInterview ? "Next interview is scheduled" : "No interview currently scheduled" },
          { label: "Profile progress", value: `${data.average_completeness || 0}%`, detail: `${data.analyzed_resumes || 0} resume${data.analyzed_resumes === 1 ? "" : "s"} reviewed` },
        ]}
      />

      <section className="executive-command-grid executive-command-grid-primary">
        <article className="executive-panel">
          <SectionHeader eyebrow="NEEDS ATTENTION" title="What to handle next" description="A short list of open actions so nothing important gets lost." />
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

        <div className="executive-dashboard-side-stack">
          <article className="executive-panel">
            <SectionHeader eyebrow="WEEKLY GOALS" title="Keep your search moving" description="Simple activity targets stored only on this device." />
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

          <figure className="executive-dashboard-compass">
            <img src="/careernaviq-compass-architecture.webp?v=20260810office" alt="Antique brass compass, the CareerNavIQ symbol for navigating a career journey" />
          </figure>
        </div>
      </section>

      <section className="executive-panel">
        <SectionHeader eyebrow="APPLICATION PROGRESS" title="Where your opportunities stand" description="See how saved roles are moving from interest to offer." actions={<Link href="/applications">Open Applications →</Link>} />
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
      </section>

      <section className="executive-panel executive-action-panel">
        <SectionHeader eyebrow="TOOLS" title="Go directly to what you need" />
        <div className="executive-action-grid-v6">
          <Link href="/jobs"><strong>Find Jobs</strong><span>Search and compare current opportunities.</span></Link>
          <Link href="/applications"><strong>Applications</strong><span>Track statuses, follow-ups, and decisions.</span></Link>
          <Link href="/resumes/studio"><strong>Tailor Resume</strong><span>Prepare a resume for a specific job.</span></Link>
          <Link href="/crm"><strong>Contacts</strong><span>Manage recruiter and hiring relationships.</span></Link>
          <Link href="/interview-coach"><strong>Interview Prep</strong><span>Practice answers, stories, and questions.</span></Link>
          <Link href="/analytics"><strong>Analytics</strong><span>See what is working and where to adjust.</span></Link>
        </div>
      </section>
    </>
  );
}
