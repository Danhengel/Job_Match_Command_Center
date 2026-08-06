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
    id: "foundation",
    number: 1,
    label: "Build your foundation",
    shortLabel: "Build",
    description: "Profile, résumé, and positioning",
    href: "/profiles",
    items: [
      { href: "/profiles", label: "Career profile" },
      { href: "/resumes", label: "Résumé library" },
      { href: "/resumes/studio", label: "Résumé Studio" },
    ],
  },
  {
    id: "discover",
    number: 2,
    label: "Discover opportunities",
    shortLabel: "Discover",
    description: "Jobs, companies, and alerts",
    href: "/jobs",
    items: [
      { href: "/jobs", label: "Job search" },
      { href: "/companies", label: "Companies" },
      { href: "/company-watches", label: "Career watches" },
    ],
  },
  {
    id: "prepare",
    number: 3,
    label: "Prepare your application",
    shortLabel: "Prepare",
    description: "Tailoring and outreach",
    href: "/coach",
    items: [
      { href: "/coach", label: "Application Studio" },
      { href: "/outreach", label: "Outreach Studio" },
    ],
  },
  {
    id: "track",
    number: 4,
    label: "Apply and track",
    shortLabel: "Track",
    description: "Pipeline and relationships",
    href: "/applications",
    items: [
      { href: "/applications", label: "Application pipeline" },
      { href: "/crm", label: "Recruiter CRM" },
    ],
  },
  {
    id: "interview",
    number: 5,
    label: "Interview and follow up",
    shortLabel: "Interview",
    description: "Preparation, calendar, and follow-up",
    href: "/interviews",
    items: [
      { href: "/interviews", label: "Interview center" },
      { href: "/interview-coach", label: "AI interview coach" },
      { href: "/calendar", label: "Career calendar" },
      { href: "/notifications", label: "Notifications" },
    ],
  },
];

export const UTILITY_LINKS: CareerJourneyItem[] = [
  { href: "/command-center", label: "Command center" },
  { href: "/analytics", label: "Analytics" },
  { href: "/reports/weekly", label: "Weekly report" },
  { href: "/automation", label: "Automation" },
  { href: "/settings/automation", label: "Settings" },
];

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getCareerStage(pathname: string) {
  return CAREER_STAGES.find((stage) =>
    stage.items.some((item) => isActivePath(pathname, item.href)),
  );
}

export function getCurrentPageLabel(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard";

  const allItems = [
    ...CAREER_STAGES.flatMap((stage) => stage.items),
    ...UTILITY_LINKS,
  ].sort((left, right) => right.href.length - left.href.length);

  return allItems.find((item) => isActivePath(pathname, item.href))?.label
    ?? "Career workspace";
}
