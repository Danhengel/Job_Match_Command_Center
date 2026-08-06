export type EmployerPriority = "Top match" | "Strong match";

export type EmployerCategory =
  | "Banking & credit unions"
  | "CRE finance & servicing"
  | "Affordable housing & impact"
  | "Asset management & private credit"
  | "Fintech & lending technology"
  | "Capital programs & consulting"
  | "Real estate development & housing";

export type RecommendedEmployer = {
  company: string;
  career_url: string;
  category: EmployerCategory;
  priority: EmployerPriority;
};

export const employerCategoryDetails: Record<EmployerCategory, { label: string; focus: string }> = {
  "Banking & credit unions": {
    label: "Banking & credit unions",
    focus: "construction lending, commercial loan operations, credit administration, servicing, portfolio governance, and risk leadership",
  },
  "CRE finance & servicing": {
    label: "CRE finance & servicing",
    focus: "construction draws, CRE loan servicing, asset management, special servicing, credit administration, and operational controls",
  },
  "Affordable housing & impact": {
    label: "Affordable housing & impact",
    focus: "LIHTC, CDFI and community development finance, capital deployment, fund management, and compliance",
  },
  "Asset management & private credit": {
    label: "Asset management & private credit",
    focus: "real estate debt, portfolio management, loan management, credit risk, and institutional operations",
  },
  "Fintech & lending technology": {
    label: "Fintech & lending technology",
    focus: "commercial lending platforms, banking operations, implementation, workflow automation, and servicing transformation",
  },
  "Capital programs & consulting": {
    label: "Capital programs & consulting",
    focus: "large capital programs, public-sector delivery, PMO leadership, operations transformation, controls, and risk",
  },
  "Real estate development & housing": {
    label: "Real estate development & housing",
    focus: "construction oversight, capital projects, affordable housing development, portfolio operations, and governance",
  },
};
