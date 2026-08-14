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

export const PRIMARY_NAV: CareerJourneyItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Applications" },
  { href: "/resumes", label: "Resume" },
  { href: "/profiles", label: "Profile" },
];

export const SECONDARY_NAV: CareerJourneyItem[] = [
  { href: "/resumes/studio", label: "Resume Studio" },
  { href: "/coach", label: "Application Prep" },
  { href: "/interviews", label: "Interview Prep" },
  { href: "/interview-coach", label: "Practice Interviews" },
  { href: "/companies", label: "Companies" },
  { href: "/company-watches", label: "Saved Companies" },
  { href: "/crm", label: "Contacts" },
  { href: "/outreach", label: "Outreach" },
  { href: "/calendar", label: "Calendar" },
  { href: "/analytics", label: "Analytics" },
  { href: "/reports/weekly", label: "Weekly Report" },
  { href: "/automation", label: "Automation" },
];

export const CAREER_STAGES: CareerStage[] = [
  {
    id: "positioning",
    number: 1,
    label: "Build your profile and resume",
    shortLabel: "Profile & Resume",
    description: "Set your target, preferences, and experience",
    href: "/profiles",
    items: [
      { href: "/profiles", label: "Profile" },
      { href: "/resumes", label: "Resume" },
      { href: "/resumes/studio", label: "Tailor Resume" },
    ],
  },
  {
    id: "market",
    number: 2,
    label: "Find matching jobs",
    shortLabel: "Jobs",
    description: "Find roles and companies that fit your goals",
    href: "/jobs",
    items: [
      { href: "/jobs", label: "Jobs" },
      { href: "/companies", label: "Companies" },
      { href: "/company-watches", label: "Saved Companies" },
    ],
  },
  {
    id: "pursuit",
    number: 3,
    label: "Prepare and apply",
    shortLabel: "Apply",
    description: "Tailor your materials and outreach",
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
    description: "Track progress, follow-ups, and decisions",
    href: "/applications",
    items: [
      { href: "/applications", label: "Applications" },
      { href: "/crm", label: "Contacts" },
    ],
  },
  {
    id: "interviews",
    number: 5,
    label: "Prepare for interviews",
    shortLabel: "Interviews",
    description: "Prepare, practice, schedule, and follow up",
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
  { href: "/notifications", label: "Notifications" },
  { href: "/settings/automation", label: "Settings" },
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
  if (pathname === "/tools") return "Tools";

  return getActiveJourneyItem(pathname, [
    ...CAREER_STAGES.flatMap((stage) => stage.items),
    ...SECONDARY_NAV,
    ...UTILITY_LINKS,
  ])?.label ?? "Career Workspace";
}
