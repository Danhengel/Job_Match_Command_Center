"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Notice } from "@/components/ui";
import { api } from "@/lib/api";

type DashboardData = {
  user_name?: string;
  average_completeness?: number;
  resume_count?: number;
  analyzed_resumes?: number;
  high_match_count?: number;
  application_count?: number;
  interview_count?: number;
  offer_count?: number;
  followups_due?: number;
  status_counts?: Record<string, number>;
};

type DigestData = {
  unread_count?: number;
  high_matches?: number;
  follow_ups_due?: number;
};

type Interview = {
  id: number;
  application_id: number;
  title: string;
  event_type: string;
  starts_at: string;
  completed: boolean;
};

type Recruiter = {
  id: number;
  name: string;
  company: string;
  next_follow_up_at: string | null;
  last_contact_at: string | null;
  relationship_score: number;
};

type SearchRun = {
  id: number;
  unique_count: number;
  matched_count: number;
  created_at: string;
};

type Application = {
  id: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  job?: {
    title: string;
    company: string;
  };
};

type Profile = {
  id: number;
  name: string;
};

type JobMatch = {
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    salary?: string;
    remote?: boolean;
  };
  match: {
    score: number;
    explanation?: string;
  };
};

type PriorityAction = {
  title: string;
  detail: string;
  href: string;
  action: string;
};

type UpcomingItem = {
  id: string;
  title: string;
  detail: string;
  date: string;
  href: string;
};

function safeDate(value?: string | null) {
  return value ? new Date(value) : null;
}

function daysUntil(value: string) {
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
}

function daypart() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function dateParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { day: "—", month: "DATE" };
  return {
    day: date.toLocaleDateString("en-US", { day: "2-digit" }),
    month: date.toLocaleDateString("en-US", { month: "short" }),
  };
}

function fullDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function freshness(value?: string) {
  const date = safeDate(value);
  if (!date) return "No recent scan";
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  return `Updated ${days} days ago`;
}

function statusLabel(value?: string) {
  if (!value) return "Tracked";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [searches, setSearches] = useState<SearchRun[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [savedMatches, setSavedMatches] = useState<JobMatch[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [dashboard, interviewData, recruiterData, searchData, appData, profileData] = await Promise.all([
          api("/api/dashboard"),
          api("/api/recruiting/interviews").catch(() => []),
          api("/api/recruiting/recruiters").catch(() => []),
          api("/api/jobs/history").catch(() => []),
          api("/api/applications").catch(() => ({ applications: [] })),
          api("/api/profiles").catch(() => []),
        ]);

        if (!active) return;
        setData(dashboard);
        setInterviews(Array.isArray(interviewData) ? interviewData : []);
        setRecruiters(Array.isArray(recruiterData) ? recruiterData : []);
        setSearches(Array.isArray(searchData) ? searchData : []);
        setApplications(Array.isArray(appData?.applications) ? appData.applications : []);

        const profiles: Profile[] = Array.isArray(profileData) ? profileData : [];
        if (profiles[0]?.id) {
          try {
            const matches = await api(`/api/jobs/matches/${profiles[0].id}`);
            if (active) setSavedMatches(Array.isArray(matches) ? matches : []);
          } catch {
            if (active) setSavedMatches([]);
          }
        }

        try {
          const digestData = await api("/api/automation/digest");
          if (active) setDigest(digestData);
        } catch {
          if (active) setDigest(null);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load your dashboard.");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const computed = useMemo(() => {
    const now = Date.now();
    const stages = data?.status_counts || {};
    const upcomingInterviews = interviews
      .filter((item) => !item.completed && new Date(item.starts_at).getTime() >= now)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    const dueRecruiters = recruiters
      .filter((item) => item.next_follow_up_at && new Date(item.next_follow_up_at).getTime() <= now)
      .sort((a, b) => String(a.next_follow_up_at).localeCompare(String(b.next_follow_up_at)));
    const latestSearch = [...searches].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
    const rankedMatches = [...savedMatches].sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0));
    const applicationsCount = data?.application_count ?? applications.length;
    const interviewing = Math.max(
      data?.interview_count || 0,
      (stages.recruiter || 0) + (stages.interview || 0) + (stages.final || 0),
    );
    const offers = Math.max(data?.offer_count || 0, (stages.offer || 0) + (stages.accepted || 0));
    const dueCount = Math.max(data?.followups_due || 0, digest?.follow_ups_due || 0, dueRecruiters.length);

    return {
      stages,
      upcomingInterviews,
      nextInterview: upcomingInterviews[0] || null,
      dueRecruiters,
      dueCount,
      latestSearch,
      rankedMatches,
      applicationsCount,
      interviewing,
      offers,
    };
  }, [data, digest, interviews, recruiters, searches, applications, savedMatches]);

  if (error) {
    return <Notice title="Dashboard unavailable" tone="error"><p>{error}</p></Notice>;
  }

  if (!data) {
    return <section className="executive-loading"><p className="eyebrow">HOME</p><h2>Preparing your command center…</h2></section>;
  }

  const firstName = data.user_name?.trim().split(/\s+/)[0] || "there";
  const highMatches = data.high_match_count ?? digest?.high_matches ?? computed.rankedMatches.filter((item) => item.match.score >= 70).length;
  const profileProgress = Math.round(data.average_completeness || 0);
  const topMatch = computed.rankedMatches[0] || null;

  const priorityActions: PriorityAction[] = [
    computed.nextInterview
      ? {
          title: `Prepare for ${computed.nextInterview.title}`,
          detail: `${Math.max(0, daysUntil(computed.nextInterview.starts_at))} day${daysUntil(computed.nextInterview.starts_at) === 1 ? "" : "s"} remaining · ${fullDate(computed.nextInterview.starts_at)}`,
          href: "/interview-coach",
          action: "Continue preparation",
        }
      : {
          title: highMatches ? `Review ${highMatches} strong job match${highMatches === 1 ? "" : "es"}` : "Run your next market scan",
          detail: highMatches ? "Start with the highest-alignment opportunities before the market moves." : "Refresh the market and surface the strongest roles for your profile.",
          href: "/jobs",
          action: highMatches ? "Review matches" : "Find opportunities",
        },
    computed.dueCount
      ? {
          title: `${computed.dueCount} follow-up${computed.dueCount === 1 ? "" : "s"} need attention`,
          detail: "Keep active opportunities and recruiter relationships from going quiet.",
          href: "/crm",
          action: "Handle follow-ups",
        }
      : {
          title: "Review your active application pipeline",
          detail: "Confirm each tracked opportunity has a clear status and next action.",
          href: "/applications",
          action: "Open applications",
        },
    highMatches && computed.nextInterview
      ? {
          title: `Review ${highMatches} strong job match${highMatches === 1 ? "" : "es"}`,
          detail: topMatch ? `${topMatch.job.title} at ${topMatch.job.company} currently leads your saved market results.` : "Protect time for the strongest new opportunities while you prepare for interviews.",
          href: "/jobs",
          action: "Review opportunities",
        }
      : profileProgress < 90
        ? {
            title: `Raise profile readiness from ${profileProgress}%`,
            detail: "A more complete profile improves matching, positioning, and the quality of recommendations.",
            href: "/profiles",
            action: "Strengthen profile",
          }
        : {
            title: "Keep your resume ready for the next priority role",
            detail: "Review the current resume and tailor only when an opportunity is worth pursuing.",
            href: "/resumes",
            action: "Review resume",
          },
  ];

  const upcomingItems: UpcomingItem[] = [
    ...computed.upcomingInterviews.slice(0, 3).map((item) => ({
      id: `interview-${item.id}`,
      title: item.title,
      detail: `${item.event_type || "Interview"} · ${fullDate(item.starts_at)}`,
      date: item.starts_at,
      href: "/interviews",
    })),
    ...computed.dueRecruiters.slice(0, Math.max(0, 4 - computed.upcomingInterviews.slice(0, 3).length)).map((item) => ({
      id: `recruiter-${item.id}`,
      title: `Follow up with ${item.name}`,
      detail: item.company ? `${item.company} · relationship follow-up` : "Relationship follow-up",
      date: item.next_follow_up_at || new Date().toISOString(),
      href: "/crm",
    })),
  ].slice(0, 4);

  const activeApplications = [...applications]
    .filter((item) => item.job?.title)
    .sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")))
    .slice(0, 5);

  const insight = computed.nextInterview
    ? {
        title: "Your highest-leverage move is interview preparation.",
        body: `${computed.nextInterview.title} is your nearest time-sensitive opportunity. Finish your stories, company research, likely questions, and closing questions before shifting attention back to new applications.`,
        href: "/interview-coach",
        action: "Continue interview prep",
      }
    : computed.dueCount
      ? {
          title: "Your pipeline has momentum, but follow-ups are now the highest-value work.",
          body: `${computed.dueCount} follow-up${computed.dueCount === 1 ? " is" : "s are"} due. Closing those loops is more valuable right now than adding another layer of passive job searching.`,
          href: "/crm",
          action: "Clear follow-ups",
        }
      : topMatch
        ? {
            title: `${topMatch.job.title} at ${topMatch.job.company} is your strongest current market signal.`,
            body: `It is scoring ${Math.round(topMatch.match.score)}% alignment in your saved results. Review the role closely and decide whether it deserves a tailored resume and an application.`,
            href: "/jobs",
            action: "Review top opportunity",
          }
        : {
            title: "Your next best move is to refresh the opportunity market.",
            body: "Your core search workspace is in good shape. A fresh market scan will give CareerNavIQ better information for deciding what deserves your attention next.",
            href: "/jobs",
            action: "Run market scan",
          };

  const resumeReadiness = (data.analyzed_resumes || 0) > 0
    ? "Reviewed"
    : (data.resume_count || 0) > 0
      ? "Needs analysis"
      : "Resume needed";

  return (
    <div className="dashboard-command-center">
      <section className="dashboard-welcome">
        <div className="dashboard-welcome-copy">
          <p className="eyebrow">CAREER COMMAND CENTER</p>
          <h1>Good {daypart()}, {firstName}.</h1>
          <p>Here is what deserves your attention now—and where your strongest opportunities stand.</p>
        </div>
        <div className="dashboard-focus-count" aria-label={`${priorityActions.length} priority actions`}>
          <span>Needs attention</span>
          <strong>{priorityActions.length}</strong>
          <small>priority actions</small>
        </div>
      </section>

      <section className="dashboard-section dashboard-next-actions">
        <div className="dashboard-section-inner">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">YOUR NEXT ACTIONS</p>
              <h2>Do these next</h2>
              <p>Three actions selected from your interviews, follow-ups, opportunity market, and profile readiness.</p>
            </div>
          </div>
          <div className="dashboard-action-list">
            {priorityActions.map((item, index) => (
              <div className="dashboard-action" key={`${item.title}-${index}`}>
                <span className="dashboard-action-index">{String(index + 1).padStart(2, "0")}</span>
                <div className="dashboard-action-copy">
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <Link className="dashboard-action-link" href={item.href}>{item.action}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-inner">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">OPPORTUNITY PIPELINE</p>
              <h2>Your search at a glance</h2>
            </div>
            <Link className="dashboard-section-link" href="/applications">Open full pipeline →</Link>
          </div>
          <div className="dashboard-pipeline" aria-label="Opportunity pipeline summary">
            <Link className="dashboard-pipeline-card" href="/jobs">
              <span>Strong matches</span>
              <strong>{highMatches}</strong>
              <small>High-alignment roles</small>
            </Link>
            <Link className="dashboard-pipeline-card" href="/applications">
              <span>Applied</span>
              <strong>{computed.applicationsCount}</strong>
              <small>Tracked applications</small>
            </Link>
            <Link className="dashboard-pipeline-card" href="/interviews">
              <span>Interviewing</span>
              <strong>{computed.interviewing}</strong>
              <small>Recruiter through final</small>
            </Link>
            <Link className="dashboard-pipeline-card" href="/applications">
              <span>Offers</span>
              <strong>{computed.offers}</strong>
              <small>Offer or accepted</small>
            </Link>
          </div>
        </div>
      </section>

      <section className="dashboard-main-grid">
        <article className="dashboard-section">
          <div className="dashboard-section-inner">
            <div className="dashboard-section-heading">
              <div>
                <p className="eyebrow">PRIORITY OPPORTUNITIES</p>
                <h2>Roles worth your attention</h2>
                <p>The strongest saved matches first; recent active applications are shown when saved match data is unavailable.</p>
              </div>
              <Link className="dashboard-section-link" href="/jobs">View all jobs →</Link>
            </div>

            <div className="dashboard-opportunity-list">
              {computed.rankedMatches.length > 0 ? computed.rankedMatches.slice(0, 5).map((item) => (
                <div className="dashboard-opportunity-row" key={`${item.job.id}-${item.job.title}`}>
                  <div className="dashboard-opportunity-main">
                    <strong>{item.job.title}</strong>
                    <span className="dashboard-opportunity-company">{item.job.company}</span>
                    <span>{[item.job.location, item.job.salary].filter(Boolean).join(" · ") || "Location and compensation not listed"}</span>
                  </div>
                  <div className="dashboard-match-score">
                    <strong>{Math.round(item.match.score)}%</strong>
                    <small>match</small>
                  </div>
                  <Link className="dashboard-opportunity-link" href="/jobs">Review</Link>
                </div>
              )) : activeApplications.length > 0 ? activeApplications.map((item) => (
                <div className="dashboard-opportunity-row" key={`application-${item.id}`}>
                  <div className="dashboard-opportunity-main">
                    <strong>{item.job?.title}</strong>
                    <span className="dashboard-opportunity-company">{item.job?.company}</span>
                    <span>{statusLabel(item.status)}</span>
                  </div>
                  <div className="dashboard-match-score">
                    <strong>—</strong>
                    <small>tracked</small>
                  </div>
                  <Link className="dashboard-opportunity-link" href="/applications">Review</Link>
                </div>
              )) : (
                <div className="dashboard-empty">No priority opportunities are available yet. Run a market scan to populate this area with your strongest matches.</div>
              )}
            </div>
          </div>
        </article>

        <div className="dashboard-side-stack">
          <article className="dashboard-section">
            <div className="dashboard-section-inner">
              <div className="dashboard-section-heading">
                <div>
                  <p className="eyebrow">UPCOMING</p>
                  <h2>Time-sensitive</h2>
                  <p>Interviews and relationship follow-ups that should not slip.</p>
                </div>
              </div>
              <div className="dashboard-upcoming-list">
                {upcomingItems.length ? upcomingItems.map((item) => {
                  const parts = dateParts(item.date);
                  return (
                    <Link className="dashboard-upcoming-item" href={item.href} key={item.id}>
                      <div className="dashboard-date-badge">
                        <strong>{parts.day}</strong>
                        <small>{parts.month}</small>
                      </div>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.detail}</span>
                      </div>
                    </Link>
                  );
                }) : (
                  <div className="dashboard-empty">Nothing time-sensitive is currently scheduled. Your calendar and follow-up queue are clear.</div>
                )}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="dashboard-section dashboard-insight">
        <div className="dashboard-section-inner">
          <span className="dashboard-insight-label">CareerNavIQ Insight</span>
          <h2>{insight.title}</h2>
          <p>{insight.body}</p>
          <Link className="dashboard-insight-link" href={insight.href}>{insight.action}</Link>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-inner">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">SEARCH HEALTH</p>
              <h2>Ready for the next opportunity</h2>
            </div>
          </div>
          <div className="dashboard-health">
            <div className="dashboard-health-item">
              <span>Profile</span>
              <strong>{profileProgress}% complete</strong>
            </div>
            <div className="dashboard-health-item">
              <span>Resume</span>
              <strong>{resumeReadiness}</strong>
            </div>
            <div className="dashboard-health-item">
              <span>Market scan</span>
              <strong>{freshness(computed.latestSearch?.created_at)}</strong>
            </div>
            <div className="dashboard-health-item">
              <span>Follow-ups</span>
              <strong>{computed.dueCount ? `${computed.dueCount} due` : "Clear"}</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
