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
    eyebrow: "RECOMMENDED NEXT STEP",
    title: "Define the executive mandate behind your search",
    description: "Clarify target roles, compensation, location, and priorities before evaluating opportunities.",
    href: "/profiles/new",
    label: "Create executive profile",
  },
  {
    matches: (pathname) => /^\/profiles\/[^/]+/.test(pathname),
    eyebrow: "RECOMMENDED NEXT STEP",
    title: "Connect the experience that supports this mandate",
    description: "Add the résumé and evidence CareerNavIQ should use when evaluating your market fit.",
    href: "/resumes",
    label: "Open experience library",
  },
  {
    matches: (pathname) => pathname === "/resumes",
    eyebrow: "RECOMMENDED NEXT STEP",
    title: "Turn experience into a sharper executive position",
    description: "Review strengths, evidence gaps, and role-specific positioning before entering the market.",
    href: "/resumes/studio",
    label: "Open positioning studio",
  },
  {
    matches: (pathname) => pathname.startsWith("/resumes/studio"),
    eyebrow: "RECOMMENDED NEXT STEP",
    title: "Read the market against your position",
    description: "Evaluate live opportunities once your target profile and core experience are aligned.",
    href: "/jobs",
    label: "Open market intelligence",
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
