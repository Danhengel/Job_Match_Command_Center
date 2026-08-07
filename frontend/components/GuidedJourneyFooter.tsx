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
    title: "Set the direction for your next move",
    description: "Create or review the career compass that connects your target roles, location, compensation, and priorities.",
    back: { href: "/dashboard", label: "Navigation hub" },
    next: { href: "/profiles/new", label: "Set direction" },
  },
  {
    matches: (pathname) => pathname === "/profiles/new",
    title: "Build your career compass",
    description: "Complete your direction profile so every résumé review, opportunity search, and application stays aligned to the same destination.",
    back: { href: "/profiles", label: "Career compass" },
    nextDisabled: "Set your direction to continue",
  },
  {
    matches: (pathname) => /^\/profiles\/[^/]+/.test(pathname),
    title: "Add the résumé that supports this goal",
    description: "Your career compass sets the direction. Your résumé supplies the evidence CareerNavIQ uses to evaluate possible routes.",
    back: { href: "/profiles", label: "Career compass" },
    next: { href: "/resumes", label: "Open experience library" },
  },
  {
    matches: (pathname) => pathname === "/resumes",
    title: "Turn your experience into route-ready evidence",
    description: "Choose your primary résumé, then review its strengths, positioning, and missing evidence in the résumé route builder.",
    back: { href: "/profiles", label: "Career compass" },
    next: { href: "/resumes/studio", label: "Open route builder" },
  },
  {
    matches: (pathname) => pathname.startsWith("/resumes/studio"),
    title: "Explore routes that match your direction",
    description: "Your career compass and résumé are ready to guide a focused search across roles, employers, and opportunity sources.",
    back: { href: "/resumes", label: "Experience library" },
    next: { href: "/jobs", label: "Open opportunity map" },
  },
  {
    matches: (pathname) => /^\/jobs\/[^/]+/.test(pathname),
    title: "Turn this route into a prepared next move",
    description: "Carry the selected role into the application guide to tailor your résumé and supporting evidence.",
    back: { href: "/jobs", label: "Opportunity map" },
    next: { href: "/coach", label: "Prepare next move" },
  },
  {
    matches: (pathname) => pathname === "/jobs",
    title: "Explore the employers along your strongest routes",
    description: "Use employer research and watchlists to focus your effort on destinations worth pursuing.",
    back: { href: "/resumes/studio", label: "Résumé route builder" },
    next: { href: "/companies", label: "Explore employer landscape" },
  },
  {
    matches: (pathname) => pathname.startsWith("/companies"),
    title: "Keep important employers on your map",
    description: "Create route watches for the employers you want to monitor before preparing applications.",
    back: { href: "/jobs", label: "Opportunity map" },
    next: { href: "/company-watches", label: "Create route watches" },
  },
  {
    matches: (pathname) => pathname.startsWith("/company-watches"),
    title: "Prepare the strongest next move",
    description: "Use your fit evidence and employer research to create focused, role-specific materials.",
    back: { href: "/companies", label: "Employer landscape" },
    next: { href: "/coach", label: "Open application route" },
  },
  {
    matches: (pathname) => pathname.startsWith("/coach"),
    title: "Add a personal outreach strategy",
    description: "Support the application with concise messages for recruiters, hiring managers, and professional contacts.",
    back: { href: "/jobs", label: "Opportunity map" },
    next: { href: "/outreach", label: "Create outreach" },
  },
  {
    matches: (pathname) => pathname.startsWith("/outreach"),
    title: "Mark the next waypoint and every commitment",
    description: "Move the role into your tracker so status, deadlines, contacts, and follow-ups remain visible.",
    back: { href: "/coach", label: "Application route" },
    next: { href: "/applications", label: "Open application tracker" },
  },
  {
    matches: (pathname) => pathname.startsWith("/applications"),
    title: "Connect the people behind the application",
    description: "Organize recruiter and hiring-team relationships so each application has a clear next step.",
    back: { href: "/outreach", label: "Outreach Studio" },
    next: { href: "/crm", label: "Open network map" },
  },
  {
    matches: (pathname) => pathname.startsWith("/crm"),
    title: "Prepare for the next conversation",
    description: "Carry active opportunities and relationship context into focused interview preparation.",
    back: { href: "/applications", label: "Application tracker" },
    next: { href: "/interviews", label: "Open interview path" },
  },
  {
    matches: (pathname) => pathname === "/interviews" || /^\/interviews\/[^/]+/.test(pathname),
    title: "Practice the stories that prove your fit",
    description: "Use AI-guided practice to strengthen your answers, examples, and questions before the interview.",
    back: { href: "/crm", label: "Network map" },
    next: { href: "/interview-coach", label: "Open practice guide" },
  },
  {
    matches: (pathname) => pathname.startsWith("/interview-coach"),
    title: "Put interviews and follow-ups on the calendar",
    description: "Schedule preparation blocks, interview events, and follow-up dates so nothing is left to memory.",
    back: { href: "/interviews", label: "Interview path" },
    next: { href: "/calendar", label: "Open route calendar" },
  },
  {
    matches: (pathname) => pathname.startsWith("/calendar"),
    title: "Review the updates that need action",
    description: "Use notifications to catch search updates, application activity, interview reminders, and due follow-ups.",
    back: { href: "/interview-coach", label: "Practice guide" },
    next: { href: "/notifications", label: "Review route updates" },
  },
  {
    matches: (pathname) => pathname.startsWith("/notifications"),
    title: "Return to your navigation hub",
    description: "Your full route is connected. Use the hub to identify the highest-value waypoint to take next.",
    back: { href: "/calendar", label: "Route calendar" },
    next: { href: "/dashboard", label: "Return to navigation hub" },
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
        <span>Your route</span>
        <span>Waypoint {stage.number} of {CAREER_STAGES.length}</span>
      </div>
      <div
        className="guided-journey-progress"
        role="progressbar"
        aria-label="Career route progress"
        aria-valuemin={1}
        aria-valuemax={CAREER_STAGES.length}
        aria-valuenow={stage.number}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="guided-journey-content">
        <div>
          <p className="guided-journey-kicker">Next waypoint</p>
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
