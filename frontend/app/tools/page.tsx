import Link from "next/link";

type ToolItem = {
  href: string;
  label: string;
  description: string;
};

type ToolGroup = {
  eyebrow: string;
  title: string;
  description: string;
  items: ToolItem[];
};

const toolGroups: ToolGroup[] = [
  {
    eyebrow: "Prepare",
    title: "Position and prepare",
    description: "Strengthen your materials and get ready for applications and interviews.",
    items: [
      { href: "/resumes/studio", label: "Resume Studio", description: "Tailor your resume for a specific opportunity." },
      { href: "/coach", label: "Application Prep", description: "Build a stronger application strategy before you apply." },
      { href: "/interviews", label: "Interview Prep", description: "Organize questions, stories, and meeting preparation." },
      { href: "/interview-coach", label: "Practice Interviews", description: "Rehearse answers and sharpen your delivery." },
    ],
  },
  {
    eyebrow: "Research & relationships",
    title: "Build market intelligence",
    description: "Research target organizations and manage the relationships around your search.",
    items: [
      { href: "/companies", label: "Companies", description: "Research and compare employers that fit your goals." },
      { href: "/company-watches", label: "Saved Companies", description: "Keep priority organizations on your radar." },
      { href: "/crm", label: "Contacts", description: "Track recruiters, hiring leaders, and key relationships." },
      { href: "/outreach", label: "Outreach", description: "Plan and manage targeted follow-up and networking." },
    ],
  },
  {
    eyebrow: "Plan & measure",
    title: "Run your search",
    description: "Keep the search organized, measurable, and moving forward.",
    items: [
      { href: "/calendar", label: "Calendar", description: "See interviews, follow-ups, and important milestones." },
      { href: "/analytics", label: "Analytics", description: "Understand activity, conversion, and search momentum." },
      { href: "/reports/weekly", label: "Weekly Report", description: "Review the week and identify what needs attention next." },
      { href: "/automation", label: "Automation", description: "Reduce repetitive work and keep workflows moving." },
    ],
  },
];

export default function ToolsPage() {
  return (
    <>
      <section className="executive-page-header">
        <div className="executive-page-header-copy">
          <p className="eyebrow">Career workspace</p>
          <h1>Tools</h1>
          <p>
            Use these focused workspaces when you need deeper preparation, research,
            relationship management, or planning. Your everyday navigation stays simple.
          </p>
        </div>
      </section>

      {toolGroups.map((group) => (
        <section className="executive-panel" key={group.title}>
          <div className="executive-section-header">
            <div>
              <p className="eyebrow">{group.eyebrow}</p>
              <h2>{group.title}</h2>
              <p>{group.description}</p>
            </div>
          </div>

          <div className="tools-workspace-grid">
            {group.items.map((tool) => (
              <Link className="tools-workspace-card" href={tool.href} key={tool.href}>
                <div>
                  <h3>{tool.label}</h3>
                  <p>{tool.description}</p>
                </div>
                <span className="tools-workspace-open">Open tool →</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
