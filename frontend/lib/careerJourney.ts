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
    label: "Define your executive position",
    shortLabel: "Positioning",
    description: "Goals, experience, compensation, and executive narrative",
    href: "/profiles",
    items: [
      { href: "/profiles", label: "Executive profile" },
      { href: "/resumes", label: "Experience library" },
      { href: "/resumes/studio", label: "Positioning studio" },
    ],
  },
  {
    id: "market",
    number: 2,
    label: "Read the market",
    shortLabel: "Market",
    description: "Opportunities, target companies, and market signals",
    href: "/jobs",
    items: [
      { href: "/jobs", label: "Market intelligence" },
      { href: "/companies", label: "Target companies" },
      { href: "/company-watches", label: "Company watchlist" },
    ],
  },
  {
    id: "pursuit",
    number: 3,
    label: "Prepare the pursuit",
    shortLabel: "Pursuit",
    description: "Role strategy, tailored materials, and outreach",
    href: "/coach",
    items: [
      { href: "/coach", label: "Application strategy" },
      { href: "/outreach", label: "Outreach studio" },
    ],
  },
  {
    id: "portfolio",
    number: 4,
    label: "Manage the portfolio",
    shortLabel: "Portfolio",
    description: "Opportunities, relationships, follow-ups, and decisions",
    href: "/applications",
    items: [
      { href: "/applications", label: "Opportunity portfolio" },
      { href: "/crm", label: "Relationship network" },
    ],
  },
  {
    id: "interviews",
    number: 5,
    label: "Advance through interviews",
    shortLabel: "Interviews",
    description: "Preparation, practice, schedule, and follow-through",
    href: "/interviews",
    items: [
      { href: "/interviews", label: "Interview advisory" },
      { href: "/interview-coach", label: "Practice lab" },
      { href: "/calendar", label: "Calendar" },
      { href: "/notifications", label: "Updates" },
    ],
  },
];

export const UTILITY_LINKS: CareerJourneyItem[] = [
  { href: "/command-center", label: "Executive command center" },
  { href: "/analytics", label: "Performance intelligence" },
  { href: "/reports/weekly", label: "Weekly briefing" },
  { href: "/automation", label: "Automation" },
  { href: "/settings/automation", label: "Preferences" },
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
  if (pathname === "/dashboard") return "Executive command center";

  return getActiveJourneyItem(pathname, [
    ...CAREER_STAGES.flatMap((stage) => stage.items),
    ...UTILITY_LINKS,
  ])?.label ?? "Executive career workspace";
}
