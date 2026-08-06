"use client";

import Link from "next/link";

type JourneyLink = {
  href: string;
  label: string;
};

type JourneyStep = {
  matches: (pathname: string) => boolean;
  step: number;
  title: string;
  description: string;
  back?: JourneyLink;
  next?: JourneyLink;
  nextDisabled?: string;
};

const TOTAL_STEPS = 14;

const journeySteps: JourneyStep[] = [
  {
    matches: (pathname) => pathname === "/profiles",
    step: 1,
    title: "Build your career profile",
    description: "Start by defining the roles, locations, compensation, and priorities CareerNavIQ should use for matching.",
    back: { href: "/dashboard", label: "Dashboard" },
    next: { href: "/profiles/new", label: "Create career profile" },
  },
  {
    matches: (pathname) => pathname === "/profiles/new",
    step: 1,
    title: "Complete your career profile",
    description: "Save this profile before moving forward so your résumé and job matches stay connected to the right goals.",
    back: { href: "/profiles", label: "Career profiles" },
    nextDisabled: "Save profile to continue",
  },
  {
    matches: (pathname) => /^\/profiles\/[^/]+$/.test(pathname),
    step: 1,
    title: "Your search foundation is ready",
    description: "Next, add the résumé CareerNavIQ should analyze and use as the foundation for matching and tailoring.",
    back: { href: "/profiles", label: "Career profiles" },
    next: { href: "/resumes", label: "Upload your résumé" },
  },
  {
    matches: (pathname) => pathname === "/resumes",
    step: 2,
    title: "Turn your résumé into career intelligence",
    description: "After your primary résumé is uploaded, move into Résumé Studio to review its strengths and improve its positioning.",
    back: { href: "/profiles", label: "Career profile" },
    next: { href: "/resumes/studio", label: "Open Résumé Studio" },
  },
  {
    matches: (pathname) => pathname.startsWith("/resumes/studio"),
    step: 3,
    title: "Put your résumé to work",
    description: "Use your profile and résumé intelligence to discover stronger-fit opportunities.",
    back: { href: "/resumes", label: "Résumé library" },
    next: { href: "/jobs", label: "Find matching jobs" },
  },
  {
    matches: (pathname) => /^\/jobs\/[^/]+/.test(pathname),
    step: 4,
    title: "Prepare a focused application",
    description: "Use the selected opportunity to tailor your résumé, positioning, and application materials.",
    back: { href: "/jobs", label: "Job search" },
    next: { href: "/coach", label: "Tailor your application" },
  },
  {
    matches: (pathname) => pathname === "/jobs",
    step: 4,
    title: "Expand your opportunity research",
    description: "Review target employers and identify the organizations most aligned with your next move.",
    back: { href: "/resumes/studio", label: "Résumé Studio" },
    next: { href: "/companies", label: "Explore companies" },
  },
  {
    matches: (pathname) => pathname.startsWith("/companies"),
    step: 5,
    title: "Keep the right employers on your radar",
    description: "Create focused career watches so important openings and company activity are easier to follow.",
    back: { href: "/jobs", label: "Job search" },
    next: { href: "/company-watches", label: "Set career watches" },
  },
  {
    matches: (pathname) => pathname.startsWith("/company-watches"),
    step: 6,
    title: "Convert opportunities into applications",
    description: "When a role is worth pursuing, prepare a tailored application that connects your experience to the employer’s needs.",
    back: { href: "/companies", label: "Companies" },
    next: { href: "/coach", label: "Open Application Studio" },
  },
  {
    matches: (pathname) => pathname.startsWith("/coach"),
    step: 7,
    title: "Strengthen your outreach",
    description: "Create concise, personalized messages for recruiters, hiring managers, and professional contacts.",
    back: { href: "/company-watches", label: "Career watches" },
    next: { href: "/outreach", label: "Prepare outreach" },
  },
  {
    matches: (pathname) => pathname.startsWith("/outreach"),
    step: 8,
    title: "Track the application",
    description: "Add the opportunity to your pipeline so deadlines, follow-ups, and progress stay visible.",
    back: { href: "/coach", label: "Application Studio" },
    next: { href: "/applications", label: "Open application pipeline" },
  },
  {
    matches: (pathname) => pathname.startsWith("/applications"),
    step: 9,
    title: "Build the relationships behind the search",
    description: "Organize recruiter and hiring-team contacts connected to your active opportunities.",
    back: { href: "/outreach", label: "Outreach Studio" },
    next: { href: "/crm", label: "Manage recruiter relationships" },
  },
  {
    matches: (pathname) => pathname.startsWith("/crm"),
    step: 10,
    title: "Prepare for the conversation",
    description: "Move from relationship tracking into structured interview preparation for your most important opportunities.",
    back: { href: "/applications", label: "Application pipeline" },
    next: { href: "/interviews", label: "Open interview center" },
  },
  {
    matches: (pathname) => pathname === "/interviews" || /^\/interviews\/[^/]+/.test(pathname),
    step: 11,
    title: "Practice your strongest responses",
    description: "Use AI-guided preparation to sharpen your stories, examples, and answers before the interview.",
    back: { href: "/crm", label: "Recruiter CRM" },
    next: { href: "/interview-coach", label: "Practice with AI coach" },
  },
  {
    matches: (pathname) => pathname.startsWith("/interview-coach"),
    step: 12,
    title: "Put every commitment on the calendar",
    description: "Schedule interviews, preparation blocks, and follow-up dates so nothing important is missed.",
    back: { href: "/interviews", label: "Interview center" },
    next: { href: "/calendar", label: "Open career calendar" },
  },
  {
    matches: (pathname) => pathname.startsWith("/calendar"),
    step: 13,
    title: "Stay ahead of important updates",
    description: "Review alerts and reminders connected to your search, applications, interviews, and follow-ups.",
    back: { href: "/interview-coach", label: "AI interview coach" },
    next: { href: "/notifications", label: "Review notifications" },
  },
  {
    matches: (pathname) => pathname.startsWith("/notifications"),
    step: 14,
    title: "Your guided journey is connected",
    description: "Return to the dashboard for a complete view of your career search and the next actions that need attention.",
    back: { href: "/calendar", label: "Career calendar" },
    next: { href: "/dashboard", label: "Return to dashboard" },
  },
];

export function GuidedJourneyFooter({ pathname }: { pathname: string }) {
  const current = journeySteps.find((item) => item.matches(pathname));

  if (!current) return null;

  const progress = Math.round((current.step / TOTAL_STEPS) * 100);

  return (
    <section className="guided-journey" aria-labelledby="guided-journey-title">
      <div className="guided-journey-progress-row">
        <span>Career journey</span>
        <span>Step {current.step} of {TOTAL_STEPS}</span>
      </div>
      <div
        className="guided-journey-progress"
        role="progressbar"
        aria-label="Career journey progress"
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={current.step}
      >
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="guided-journey-content">
        <div>
          <p className="guided-journey-kicker">Recommended next step</p>
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
              <span>Next: {current.next.label}</span>
              <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <button className="guided-journey-next disabled" type="button" disabled>
              {current.nextDisabled ?? "Complete this step to continue"}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .guided-journey {
          margin-top: 32px;
          padding: 24px;
          border: 1px solid rgba(102, 153, 255, 0.3);
          border-radius: 22px;
          background:
            radial-gradient(circle at 92% 0%, rgba(80, 111, 255, 0.18), transparent 38%),
            linear-gradient(145deg, rgba(14, 38, 70, 0.98), rgba(8, 27, 50, 0.98));
          box-shadow: 0 22px 48px rgba(1, 10, 24, 0.24);
        }

        .guided-journey-progress-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          color: #9fbcf2;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .guided-journey-progress {
          height: 5px;
          margin-top: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(139, 175, 235, 0.15);
        }

        .guided-journey-progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #56c8c3, #6484ff);
          transition: width 220ms ease;
        }

        .guided-journey-content {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: end;
          gap: 32px;
          margin-top: 22px;
        }

        .guided-journey-kicker {
          margin: 0 0 6px;
          color: #75d8d1;
          font-size: 0.8rem;
          font-weight: 850;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        h2 {
          margin: 0;
          color: #ffffff;
          font-size: clamp(1.35rem, 2.2vw, 2rem);
          line-height: 1.12;
          letter-spacing: -0.03em;
        }

        .guided-journey-content p:not(.guided-journey-kicker) {
          max-width: 760px;
          margin: 10px 0 0;
          color: #a9c3ea;
          font-size: 1rem;
          line-height: 1.6;
        }

        .guided-journey-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          white-space: nowrap;
        }

        .guided-journey-back,
        .guided-journey-next {
          min-height: 48px;
          border-radius: 13px;
          font-weight: 800;
          text-decoration: none;
          transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
        }

        .guided-journey-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 14px;
          border: 1px solid rgba(143, 178, 232, 0.28);
          color: #c9daf5;
          background: rgba(5, 21, 41, 0.42);
        }

        .guided-journey-next {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 0 18px;
          border: 1px solid rgba(121, 151, 255, 0.7);
          color: #ffffff;
          background: linear-gradient(135deg, #4d73f6, #685cf3);
          box-shadow: 0 12px 24px rgba(62, 82, 210, 0.28);
          cursor: pointer;
        }

        .guided-journey-back:hover,
        .guided-journey-next:hover {
          transform: translateY(-1px);
        }

        .guided-journey-back:hover {
          border-color: rgba(143, 178, 232, 0.55);
          background: rgba(21, 46, 79, 0.72);
        }

        .guided-journey-next:hover {
          background: linear-gradient(135deg, #5c80ff, #7467ff);
        }

        .guided-journey-next.disabled {
          opacity: 0.5;
          box-shadow: none;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .guided-journey-content {
            grid-template-columns: 1fr;
            align-items: stretch;
            gap: 22px;
          }

          .guided-journey-actions {
            justify-content: space-between;
            white-space: normal;
          }
        }

        @media (max-width: 620px) {
          .guided-journey {
            margin-top: 24px;
            margin-bottom: 78px;
            padding: 20px;
            border-radius: 18px;
          }

          .guided-journey-progress-row {
            align-items: flex-start;
            font-size: 0.7rem;
          }

          .guided-journey-actions {
            flex-direction: column-reverse;
            align-items: stretch;
          }

          .guided-journey-back,
          .guided-journey-next {
            width: 100%;
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
}
