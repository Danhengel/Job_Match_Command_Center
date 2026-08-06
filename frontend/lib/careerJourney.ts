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
    label: "Define your position",
    shortLabel: "Position",
    description: "Narrative, evidence, and executive presence",
    href: "/profiles",
    items: [
      { href: "/profiles", label: "Executive profile" },
      { href: "/resumes", label: "Career archive" },
      { href: "/resumes/studio", label: "Positioning atelier" },
    ],
  },
  {
    id: "discover",
    number: 2,
    label: "Read the market",
    shortLabel: "Intelligence",
    description: "Opportunities, organizations, and signals",
    href: "/jobs",
    items: [
      { href: "/jobs", label: "Opportunity intelligence" },
      { href: "/companies", label: "Organization dossiers" },
      { href: "/company-watches", label: "Market watchlist" },
    ],
  },
  {
    id: "prepare",
    number: 3,
    label: "Shape your approach",
    shortLabel: "Distinguish",
    description: "Positioning, materials, and correspondence",
    href: "/coach",
    items: [
      { href: "/coach", label: "Opportunity strategy" },
      { href: "/outreach", label: "Correspondence studio" },
    ],
  },
  {
    id: "track",
    number: 4,
    label: "Manage your portfolio",
    shortLabel: "Portfolio",
    description: "Active pursuits and relationship capital",
    href: "/applications",
    items: [
      { href: "/applications", label: "Opportunity portfolio" },
      { href: "/crm", label: "Relationship capital" },
    ],
  },
  {
    id: "interview",
    number: 5,
    label: "Advance with intent",
    shortLabel: "Advance",
    description: "Briefings, rehearsals, and decisive follow-through",
    href: "/interviews",
    items: [
      { href: "/interviews", label: "Interview briefings" },
      { href: "/interview-coach", label: "Rehearsal room" },
      { href: "/calendar", label: "Engagement calendar" },
      { href: "/notifications", label: "Private briefings" },
    ],
  },
];

export const UTILITY_LINKS: CareerJourneyItem[] = [
  { href: "/command-center", label: "Intelligence desk" },
  { href: "/analytics", label: "Portfolio analytics" },
  { href: "/reports/weekly", label: "Weekly briefing" },
  { href: "/automation", label: "Private concierge" },
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
  if (pathname === "/dashboard") return "Private office";

  return getActiveJourneyItem(pathname, [
    ...CAREER_STAGES.flatMap((stage) => stage.items),
    ...UTILITY_LINKS,
  ])?.label ?? "Private career office";
}
