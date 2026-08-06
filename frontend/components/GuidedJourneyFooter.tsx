"use client";

import Link from "next/link";

import { CAREER_STAGES, getCareerStage } from "@/lib/careerJourney";

type JourneyLink = {
  href: string;
  label: string;
};

type JourneyAction = {
  matches: (pathname: string) => boolean;
  title: string;
  description: string;
  back?: JourneyLink;
  next?: JourneyLink;
  nextDisabled?: string;
};

const journeyActions: JourneyAction[] = [
  {
    matches: (pathname) => pathname === "/profiles",
    title: "Define what a strong opportunity looks like",
    description: "Create or review the career profile that controls your role, location, compensation, and match preferences.",
    back: { href: "/dashboard", label: "Dashboard" },
    next: { href: "/profiles/new", label: "Create career profile" },
  },
  {
    matches: (pathname) => pathname === "/profiles/new",
    title: "Save your search foundation",
    description: "Complete the profile so every résumé analysis, job search, and application stays connected to the right goal.",
    back: { href: "/profiles", label: "Career profiles" },
    nextDisabled: "Save the profile to continue",
  },
  {
    matches: (pathname) => /^\/profiles\/[^/]+/.test(pathname),
    title: "Add the résumé that supports this goal",
    description: "Your profile is the target. Your résumé supplies the evidence CareerNavIQ uses to rank and tailor opportunities.",
    back: { href: "/profiles", label: "Career profiles" },
    next: { href: "/resumes", label: "Open résumé library" },
  },
  {
    matches: (pathname) => pathname === "/resumes",
    title: "Turn your résumé into usable evidence",
    description: "Choose your primary résumé, then review its positioning, strengths, and missing evidence in Résumé Studio.",
    back: { href: "/profiles", label: "Career profile" },
    next: { href: "/resumes/studio", label: "Open Résumé Studio" },
  },
  {
    matches: (pathname) => pathname.startsWith("/resumes/studio"),
    title: "Use your foundation to find opportunities",
    description: "Your profile and résumé are ready to power a targeted search across employers and job publishers.",
    back: { href: "/resumes", label: "Résumé library" },
    next: { href: "/jobs", label: "Search jobs" },
  },
  {
    matches: (pathname) => /^\/jobs\/[^/]+/.test(pathname),
    title: "Convert this match into an application",
    description: "Carry the selected role into Application Studio to tailor your résumé and application evidence.",
    back: { href: "/jobs", label: "Job search" },
    next: { href: "/coach", label: "Prepare application" },
  },
  {
    matches: (pathname) => pathname === "/jobs",
    title: "Prioritize the employers behind your matches",
    description: "Use company research and career watches to focus your effort on organizations worth pursuing.",
    back: { href: "/resumes/studio", label: "Résumé Studio" },
    next: { href: "/companies", label: "Explore companies" },
  },
  {
    matches: (pathname) => pathname.startsWith("/companies"),
    title: "Keep important employers visible",
    description: "Create career watches for the companies you want to monitor before moving into application preparation.",
    back: { href: "/jobs", label: "Job search" },
    next: { href: "/company-watches", label: "Create career watches" },
  },
  {
    matches: (pathname) => pathname.startsWith("/company-watches"),
    title: "Prepare the strongest application",
    description: "Use your match evidence and employer research to create focused, role-specific materials.",
    back: { href: "/companies", label: "Companies" },
    next: { href: "/coach", label: "Open Application Studio" },
  },
  {
    matches: (pathname) => pathname.startsWith("/coach"),
    title: "Add a personal outreach strategy",
    description: "Support the application with concise messages for recruiters, hiring managers, and professional contacts.",
    back: { href: "/jobs", label: "Job search" },
    next: { href: "/outreach", label: "Create outreach" },
  },
  {
    matches: (pathname) => pathname.startsWith("/outreach"),
    title: "Track the opportunity and every commitment",
    description: "Move the role into your pipeline so status, deadlines, contacts, and follow-ups remain visible.",
    back: { href: "/coach", label: "Application Studio" },
    next: { href: "/applications", label: "Open application pipeline" },
  },
  {
    matches: (pathname) => pathname.startsWith("/applications"),
    title: "Connect the people behind the application",
    description: "Organize recruiter and hiring-team relationships so each application has a clear follow-up plan.",
    back: { href: "/outreach", label: "Outreach Studio" },
    next: { href: "/crm", label: "Open recruiter CRM" },
  },
  {
    matches: (pathname) => pathname.startsWith("/crm"),
    title: "Prepare for the next conversation",
    description: "Move active opportunities and relationship context into structured interview preparation.",
    back: { href: "/applications", label: "Application pipeline" },
    next: { href: "/interviews", label: "Open interview center" },
  },
  {
    matches: (pathname) => pathname === "/interviews" || /^\/interviews\/[^/]+/.test(pathname),
    title: "Practice the stories that prove your fit",
    description: "Use AI-guided practice to strengthen your answers, examples, and questions before the interview.",
    back: { href: "/crm", label: "Recruiter CRM" },
    next: { href: "/interview-coach", label: "Practice with AI coach" },
  },
  {
    matches: (pathname) => pathname.startsWith("/interview-coach"),
    title: "Put interviews and follow-ups on the calendar",
    description: "Schedule preparation blocks, interview events, and follow-up dates so nothing is left to memory.",
    back: { href: "/interviews", label: "Interview center" },
    next: { href: "/calendar", label: "Open career calendar" },
  },
  {
    matches: (pathname) => pathname.startsWith("/calendar"),
    title: "Review the updates that need action",
    description: "Use notifications to catch search updates, application activity, interview reminders, and due follow-ups.",
    back: { href: "/interview-coach", label: "AI interview coach" },
    next: { href: "/notifications", label: "Review notifications" },
  },
  {
    matches: (pathname) => pathname.startsWith("/notifications"),
    title: "Return to your command center",
    description: "The full process is connected. Use the dashboard to identify the highest-value action to take next.",
    back: { href: "/calendar", label: "Career calendar" },
    next: { href: "/dashboard", label: "Return to dashboard" },
  },
];

export function GuidedJourneyFooter({ pathname }: { pathname: string }) {
  const stage = getCareerStage(pathname);
  const current = journeyActions.find((item) => item.matches(pathname));

  if (!stage || !current) return null;

  const progress = Math.round((stage.number / CAREER_STAGES.length) * 100);

  return (
    <section className="guided-journey" aria-labelledby="guided-journey-title">
      <div className="guided-journey-progress-row">
        <span>Career process</span>
        <span>Stage {stage.number} of {CAREER_STAGES.length}</span>
      </div>
      <div
        className="guided-journey-progress"
        role="progressbar"
        aria-label="Career process progress"
        aria-valuemin={1}
        aria-valuemax={CAREER_STAGES.length}
        aria-valuenow={stage.number}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="guided-journey-content">
        <div>
          <p className="guided-journey-kicker">Next best action</p>
          <h2 id="guided-journey-title">{current.title}</h2>
          <p>{current.description}</p>
        </div>

        <div className="guided-journey-actions">
          {current.back ? (
            <Link className="guided-journey-back" href={current.back.href}>
              <span aria-hidden="true">←</span>
              {current.back.label}
            </Link>
          ) : <span />}

          {current.next ? (
            <Link className="guided-journey-next" href={current.next.href}>
              <span>{current.next.label}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <button className="guided-journey-next disabled" type="button" disabled>
              {current.nextDisabled ?? "Complete this action to continue"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
