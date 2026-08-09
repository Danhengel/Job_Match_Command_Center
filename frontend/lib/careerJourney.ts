export type CareerJourneyItem = {
  href: string;
  label: string;
};

export type CareerStage = {
  id: string;
  number: number;
  label: string;
  shortLabel: string;
  description: string;
  href: string;
  items: CareerJourneyItem[];
};

export const CAREER_STAGES: CareerStage[] = [
  {
    id: "positioning",
    number: 1,
    label: "Build your profile and resume",
    shortLabel: "Profile & Resume",
    description: "Career goals, target roles, work preferences, and resumes",
    href: "/profiles",
    items: [
      { href: "/profiles", label: "Career Profile" },
      { href: "/resumes", label: "Resumes" },
      { href: "/resumes/studio", label: "Resume Tailoring" },
    ],
  },
  {
    id: "market",
    number: 2,
    label: "Find matching jobs",
    shortLabel: "Find Jobs",
    description: "Job matches, companies, and saved employers",
    href: "/jobs",
    items: [
      { href: "/jobs", label: "Job Search" },
      { href: "/companies", label: "Companies" },
      { href: "/company-watches", label: "Saved Companies" },
    ],
  },
  {
    id: "pursuit",
    number: 3,
    label: "Prepare and apply",
    shortLabel: "Apply",
    description: "Application strategy, tailored materials, and outreach",
    href: "/coach",
    items: [
      { href: "/coach", label: "Application Prep" },
      { href: "/outreach", label: "Outreach" },
    ],
  },
  {
    id: "portfolio",
    number: 4,
    label: "Track applications and contacts",
    shortLabel: "Applications",
    description: "Applications, contacts, follow-ups, and decisions",
    href: "/applications",
    items: [
      { href: "/applications", label: "Application Tracker" },
      { href: "/crm", label: "Contacts" },
    ],
  },
  {
    id: "interviews",
    number: 5,
    label: "Prepare for interviews",
    shortLabel: "Interviews",
    description: "Interview prep, practice, schedule, and follow-up",
    href: "/interviews",
    items: [
      { href: "/interviews", label: "Interview Prep" },
      { href: "/interview-coach", label: "Practice Interviews" },
      { href: "/calendar", label: "Calendar" },
      { href: "/notifications", label: "Notifications" },
    ],
  },
];

export const UTILITY_LINKS: CareerJourneyItem[] = [
  { href: "/analytics", label: "Analytics" },
  { href: "/reports/weekly", label: "Weekly Report" },
  { href: "/automation", label: "Automation" },
  { href: "/settings/automation", label: "Automation Settings" },
];

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getActiveJourneyItem(
  pathname: string,
  items: CareerJourneyItem[],
) {
  return [...items]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => isActivePath(pathname, item.href));
}

export function getCareerStage(pathname: string) {
  return CAREER_STAGES.find((stage) =>
    Boolean(getActiveJourneyItem(pathname, stage.items)),
  );
}

export function getCurrentPageLabel(pathname: string) {
  if (pathname === "/dashboard" || pathname === "/command-center") return "Dashboard";

  return getActiveJourneyItem(pathname, [
    ...CAREER_STAGES.flatMap((stage) => stage.items),
    ...UTILITY_LINKS,
  ])?.label ?? "Career Workspace";
}
