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
    label: "Define your mandate",
    shortLabel: "Positioning",
    description: "Executive profile, experience, and career mandate",
    href: "/profiles",
    items: [
      { href: "/profiles", label: "Executive profile" },
      { href: "/resumes", label: "Experience portfolio" },
      { href: "/resumes/studio", label: "Résumé studio" },
    ],
  },
  {
    id: "discover",
    number: 2,
    label: "Read the market",
    shortLabel: "Market",
    description: "Opportunities, target organizations, and market signals",
    href: "/jobs",
    items: [
      { href: "/jobs", label: "Opportunity intelligence" },
      { href: "/companies", label: "Target organizations" },
      { href: "/company-watches", label: "Market watchlist" },
    ],
  },
  {
    id: "prepare",
    number: 3,
    label: "Shape your position",
    shortLabel: "Strategy",
    description: "Role positioning, materials, and executive outreach",
    href: "/coach",
    items: [
      { href: "/coach", label: "Application strategy" },
      { href: "/outreach", label: "Executive outreach" },
    ],
  },
  {
    id: "track",
    number: 4,
    label: "Manage the pipeline",
    shortLabel: "Pipeline",
    description: "Applications, relationships, and decision points",
    href: "/applications",
    items: [
      { href: "/applications", label: "Opportunity pipeline" },
      { href: "/crm", label: "Relationship map" },
    ],
  },
  {
    id: "interview",
    number: 5,
    label: "Advance the opportunity",
    shortLabel: "Advance",
    description: "Interview strategy, schedule, and follow-through",
    href: "/interviews",
    items: [
      { href: "/interviews", label: "Interview center" },
      { href: "/interview-coach", label: "Executive practice" },
      { href: "/calendar", label: "Calendar" },
      { href: "/notifications", label: "Updates" },
    ],
  },
];

export const UTILITY_LINKS: CareerJourneyItem[] = [
  { href: "/command-center", label: "Command center" },
  { href: "/analytics", label: "Performance intelligence" },
  { href: "/reports/weekly", label: "Weekly executive brief" },
  { href: "/automation", label: "Automation desk" },
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
  if (pathname === "/dashboard") return "Executive briefing";

  return getActiveJourneyItem(pathname, [
    ...CAREER_STAGES.flatMap((stage) => stage.items),
    ...UTILITY_LINKS,
  ])?.label ?? "Career intelligence";
}
