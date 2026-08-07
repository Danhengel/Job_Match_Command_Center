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
    label: "Set your direction",
    shortLabel: "Direction",
    description: "Goals, strengths, and career compass",
    href: "/profiles",
    items: [
      { href: "/profiles", label: "Career compass" },
      { href: "/resumes", label: "Experience library" },
      { href: "/resumes/studio", label: "Résumé route builder" },
    ],
  },
  {
    id: "discover",
    number: 2,
    label: "Explore possibilities",
    shortLabel: "Explore",
    description: "Roles, employers, and route options",
    href: "/jobs",
    items: [
      { href: "/jobs", label: "Opportunity map" },
      { href: "/companies", label: "Employer landscape" },
      { href: "/company-watches", label: "Route watchlist" },
    ],
  },
  {
    id: "prepare",
    number: 3,
    label: "Build your route",
    shortLabel: "Prepare",
    description: "Tailored materials and outreach",
    href: "/coach",
    items: [
      { href: "/coach", label: "Application route" },
      { href: "/outreach", label: "Outreach studio" },
    ],
  },
  {
    id: "track",
    number: 4,
    label: "Track your progress",
    shortLabel: "Track",
    description: "Applications, people, and next waypoints",
    href: "/applications",
    items: [
      { href: "/applications", label: "Application tracker" },
      { href: "/crm", label: "Network map" },
    ],
  },
  {
    id: "interview",
    number: 5,
    label: "Navigate interviews",
    shortLabel: "Advance",
    description: "Interview prep, schedule, and follow-through",
    href: "/interviews",
    items: [
      { href: "/interviews", label: "Interview path" },
      { href: "/interview-coach", label: "Practice guide" },
      { href: "/calendar", label: "Route calendar" },
      { href: "/notifications", label: "Route updates" },
    ],
  },
];

export const UTILITY_LINKS: CareerJourneyItem[] = [
  { href: "/command-center", label: "Route overview" },
  { href: "/analytics", label: "Progress insights" },
  { href: "/reports/weekly", label: "Weekly route review" },
  { href: "/automation", label: "Route assistant" },
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
  if (pathname === "/dashboard") return "Navigation hub";

  return getActiveJourneyItem(pathname, [
    ...CAREER_STAGES.flatMap((stage) => stage.items),
    ...UTILITY_LINKS,
  ])?.label ?? "Career navigation";
}
