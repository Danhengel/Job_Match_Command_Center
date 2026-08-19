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
];

export const SIDEBAR_GROUPS: Array<{ label: string; items: CareerJourneyItem[] }> = [
  { label: "Step 1", items: [
    { href: "/profiles", label: "Career Profiles" },
    { href: "/resumes", label: "Resumes" },
    { href: "/resumes/studio", label: "Resume Studio" },
  ] },
  { label: "Step 2", items: [
    { href: "/companies", label: "Companies" },
    { href: "/company-watches", label: "Saved Companies" },
    { href: "/jobs", label: "Jobs" },
  ] },
  { label: "Step 3", items: [
    { href: "/coach", label: "Application Prep" },
    { href: "/applications", label: "Applications" },
    { href: "/crm", label: "Contacts" },
    { href: "/outreach", label: "Outreach" },
  ] },
  { label: "Step 4", items: [
    { href: "/interviews", label: "Interview Prep" },
    { href: "/interview-coach", label: "Practice Interview" },
    { href: "/calendar", label: "Calendar" },
  ] },
  { label: "Step 5", items: [
    { href: "/analytics", label: "Insights" },
    { href: "/reports/weekly", label: "Weekly Report" },
    { href: "/automation", label: "Automation" },
  ] },
];

export const SECONDARY_NAV: CareerJourneyItem[] = SIDEBAR_GROUPS.flatMap((group) => group.items);

export const CAREER_STAGES: CareerStage[] = [
  {
    id: "positioning",
    number: 1,
    label: "Build your profile and resume",
    shortLabel: "Profile & Resume",
    description: "Set your target, preferences, and experience",
    href: "/profiles",
    items: [
      { href: "/profiles", label: "Career Profiles" },
      { href: "/resumes", label: "Resumes" },
      { href: "/resumes/studio", label: "Resume Studio" },
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
      { href: "/applications", label: "Applications" },
      { href: "/crm", label: "Contacts" },
      { href: "/outreach", label: "Outreach" },
    ],
  },
  {
    id: "interviews",
    number: 4,
    label: "Prepare for interviews",
    shortLabel: "Interviews",
    description: "Prepare, practice, schedule, and follow up",
    href: "/interviews",
    items: [
      { href: "/interviews", label: "Interview Prep" },
      { href: "/interview-coach", label: "Practice Interview" },
      { href: "/calendar", label: "Calendar" },
    ],
  },
  {
    id: "insights",
    number: 5,
    label: "Review progress and improve",
    shortLabel: "Insights",
    description: "Use reporting and automation to improve your search",
    href: "/analytics",
    items: [
      { href: "/analytics", label: "Insights" },
      { href: "/reports/weekly", label: "Weekly Report" },
      { href: "/automation", label: "Automation" },
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
