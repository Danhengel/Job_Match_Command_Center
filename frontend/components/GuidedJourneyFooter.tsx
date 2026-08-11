"use client";

import Link from "next/link";

type Recommendation = {
  matches: (pathname: string) => boolean;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  label: string;
};

const recommendations: Recommendation[] = [
  {
    matches: (pathname) => pathname === "/profiles",
    eyebrow: "NEXT STEP",
    title: "Tell CareerNavIQ what you want next",
    description: "Set your target roles, location, compensation, and work preferences so your results are more relevant.",
    href: "/profiles/new",
    label: "Create your profile",
  },
  {
    matches: (pathname) => /^\/profiles\/[^/]+/.test(pathname),
    eyebrow: "NEXT STEP",
    title: "Add the experience that supports your target",
    description: "Upload or review your resume so CareerNavIQ can connect your experience to the roles you want.",
    href: "/resumes",
    label: "Open Resume",
  },
  {
    matches: (pathname) => pathname === "/resumes",
    eyebrow: "NEXT STEP",
    title: "Make your resume fit the opportunity",
    description: "Use your experience and a target job to create a sharper, role-specific version.",
    href: "/resumes/studio",
    label: "Tailor a resume",
  },
  {
    matches: (pathname) => pathname.startsWith("/resumes/studio"),
    eyebrow: "NEXT STEP",
    title: "See which jobs fit your profile",
    description: "Review current roles once your profile and resume are ready.",
    href: "/jobs",
    label: "Find Jobs",
  },
  {
    matches: (pathname) => /^\/jobs\/[^/]+/.test(pathname),
    eyebrow: "NEXT STEP",
    title: "Prepare a strong application",
    description: "Tailor your resume before you apply so the most relevant evidence is easy to see.",
    href: "/resumes/studio",
    label: "Tailor Resume",
  },
  {
    matches: (pathname) => pathname === "/applications",
    eyebrow: "NEXT STEP",
    title: "Keep every application moving",
    description: "Review upcoming interviews and follow-ups so active opportunities do not stall.",
    href: "/interviews",
    label: "Review interviews",
  },
  {
    matches: (pathname) => pathname === "/interviews",
    eyebrow: "NEXT STEP",
    title: "Practice before the conversation",
    description: "Rehearse your strongest stories, likely questions, and the questions you want to ask.",
    href: "/interview-coach",
    label: "Practice interview",
  },
  {
    matches: (pathname) => pathname === "/crm",
    eyebrow: "NEXT STEP",
    title: "Connect relationships to active opportunities",
    description: "Return to your applications to make sure each relationship and follow-up supports a current pursuit.",
    href: "/applications",
    label: "Open Applications",
  },
];

export function GuidedJourneyFooter({ pathname }: { pathname: string }) {
  const current = recommendations.find((item) => item.matches(pathname));
  if (!current) return null;

  return (
    <aside className="executive-recommendation" aria-label="Recommended next step">
      <div>
        <p className="eyebrow">{current.eyebrow}</p>
        <h2>{current.title}</h2>
        <p>{current.description}</p>
      </div>
      <Link className="button secondary" href={current.href}>{current.label}</Link>
    </aside>
  );
}
