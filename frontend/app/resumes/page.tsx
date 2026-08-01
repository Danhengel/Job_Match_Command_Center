"use client";

import { useMemo, useState } from "react";

type ResumeVersion = {
  id: number;
  title: string;
  subtitle: string;
  updated: string;
  atsScore: number;
  applications: number;
  content: string;
};

const startingResumes: ResumeVersion[] = [
  {
    id: 1,
    title: "Executive Master Resume",
    subtitle: "Banking, lending operations, and construction finance",
    updated: "Today",
    atsScore: 94,
    applications: 17,
    content: `DANIEL HENGEL

EXECUTIVE LENDING OPERATIONS LEADER

Executive leader with deep experience in construction lending, commercial loan operations, portfolio administration, risk management, and large-scale capital programs.

CORE EXPERTISE

• Construction loan administration
• Commercial loan servicing
• Draw administration and disbursements
• Credit and portfolio risk
• Process design and automation
• Executive reporting and governance
• Team leadership and development

PROFESSIONAL EXPERIENCE

ADVOCATES FOR HUMAN POTENTIAL
Senior Manager

• Built the construction administration and disbursement operating model for a $6.6 billion statewide behavioral-health capital program.
• Oversaw workflows supporting 437 projects and 546 facilities.
• Managed approximately 200 monthly construction funding requests.
• Developed acceptance criteria, audit controls, documentation requirements, and pre-closing processes.
• Reduced funding delays by approximately 25% through risk escalation and workflow improvements.

SUNRISE BANKS
Construction and Commercial Operations Leadership

• Directed construction lending operations across a portfolio of approximately $300 million.
• Managed draw administration, inspections, disbursement approvals, closings coordination, and portfolio monitoring.
• Improved construction draw turnaround time to approximately three business days.

PROVIDE
Operations Leadership

• Built operating processes supporting healthcare-practice acquisitions, startups, expansions, equipment financing, commercial real estate, and construction.
• Supported approximately $500 million across nearly 600 loans and projects.
• Helped scale renovation volume from 13 loans to more than 100 projects.`,
  },
  {
    id: 2,
    title: "Construction Lending Resume",
    subtitle: "Construction administration and draw operations",
    updated: "Yesterday",
    atsScore: 97,
    applications: 9,
    content: `DANIEL HENGEL

CONSTRUCTION LENDING OPERATIONS EXECUTIVE

Construction lending leader experienced in draw administration, inspections, disbursements, fund controls, risk escalation, and portfolio governance.

SELECTED ACHIEVEMENTS

• Created a construction administration framework for a $6.6 billion capital program.
• Managed workflows supporting 437 projects and 546 facilities.
• Led approximately 200 monthly construction funding requests.
• Established statewide acceptance criteria and audit-ready operating controls.
• Reduced funding delays by approximately 25%.`,
  },
  {
    id: 3,
    title: "Commercial Loan Operations",
    subtitle: "Servicing, portfolio operations, and administration",
    updated: "3 days ago",
    atsScore: 91,
    applications: 6,
    content: `DANIEL HENGEL

COMMERCIAL LOAN OPERATIONS LEADER

Commercial banking operations executive with experience in construction lending, commercial servicing, credit administration, portfolio management, documentation, risk, and operational transformation.`,
  },
];

const suggestions = [
  "Add one more quantified leadership result.",
  "Include the size of teams led directly and indirectly.",
  "Mention regulatory, audit, and compliance readiness.",
  "Strengthen technology and automation language.",
  "Add vendor-management and stakeholder-governance examples.",
];

const missingKeywords = [
  "Credit administration",
  "Portfolio governance",
  "Investor reporting",
  "Loan documentation",
  "Operational transformation",
  "Regulatory compliance",
];

export default function ResumeStudioPage() {
  const [resumes, setResumes] = useState(startingResumes);
  const [selectedId, setSelectedId] = useState(startingResumes[0].id);
  const [savedMessage, setSavedMessage] = useState("");

  const selectedResume = useMemo(
    () => resumes.find((resume) => resume.id === selectedId) ?? resumes[0],
    [resumes, selectedId]
  );

  function updateContent(content: string) {
    setResumes((current) =>
      current.map((resume) =>
        resume.id === selectedId
          ? { ...resume, content, updated: "Unsaved changes" }
          : resume
      )
    );
    setSavedMessage("");
  }

  function saveResume() {
    setResumes((current) =>
      current.map((resume) =>
        resume.id === selectedId
          ? { ...resume, updated: "Just now" }
          : resume
      )
    );
    setSavedMessage("Resume saved.");
  }

  function duplicateResume() {
    const copy: ResumeVersion = {
      ...selectedResume,
      id: Date.now(),
      title: `${selectedResume.title} Copy`,
      updated: "Just now",
      applications: 0,
    };

    setResumes((current) => [...current, copy]);
    setSelectedId(copy.id);
    setSavedMessage("Resume duplicated.");
  }

  function createResume() {
    const newResume: ResumeVersion = {
      id: Date.now(),
      title: "New Executive Resume",
      subtitle: "Untitled resume version",
      updated: "Just now",
      atsScore: 0,
      applications: 0,
      content: `DANIEL HENGEL

EXECUTIVE SUMMARY

Add your executive summary here.

CORE EXPERTISE

• Add expertise
• Add expertise
• Add expertise

PROFESSIONAL EXPERIENCE

COMPANY
Title

• Add an accomplishment with measurable results.`,
    };

    setResumes((current) => [...current, newResume]);
    setSelectedId(newResume.id);
    setSavedMessage("");
  }

  return (
    <>
      <section className="resume-studio-header">
        <div>
          <p className="eyebrow">SPRINT 12 · AI RESUME STUDIO</p>
          <h1>Executive Resume Studio</h1>
          <p className="muted">
            Manage, edit, score, and tailor role-specific resume versions.
          </p>
        </div>

        <div className="row wrap">
          <button onClick={saveResume}>Save resume</button>
          <button className="secondary" onClick={duplicateResume}>
            Duplicate
          </button>
          <button className="secondary" onClick={createResume}>
            New resume
          </button>
        </div>
      </section>

      {savedMessage && (
        <section className="resume-save-message">{savedMessage}</section>
      )}

      <section className="resume-metrics-grid">
        <article className="resume-metric">
          <span>Overall score</span>
          <strong>{selectedResume.atsScore}%</strong>
        </article>

        <article className="resume-metric">
          <span>ATS readiness</span>
          <strong>{selectedResume.atsScore}%</strong>
        </article>

        <article className="resume-metric">
          <span>Leadership</span>
          <strong>96%</strong>
        </article>

        <article className="resume-metric">
          <span>Construction lending</span>
          <strong>100%</strong>
        </article>

        <article className="resume-metric">
          <span>Commercial operations</span>
          <strong>95%</strong>
        </article>
      </section>

      <section className="resume-studio-layout">
        <aside className="resume-library-panel">
          <div className="row between">
            <div>
              <p className="eyebrow">LIBRARY</p>
              <h2>Resume versions</h2>
            </div>

            <button onClick={createResume}>+</button>
          </div>

          <div className="resume-library-list">
            {resumes.map((resume) => (
              <button
                className={`resume-library-card ${
                  resume.id === selectedId ? "active" : ""
                }`}
                key={resume.id}
                onClick={() => {
                  setSelectedId(resume.id);
                  setSavedMessage("");
                }}
              >
                <strong>{resume.title}</strong>
                <span>{resume.subtitle}</span>

                <div className="resume-library-meta">
                  <small>ATS {resume.atsScore}%</small>
                  <small>{resume.applications} applications</small>
                </div>

                <small>Updated {resume.updated}</small>
              </button>
            ))}
          </div>
        </aside>

        <main className="resume-editor-panel">
          <div className="resume-toolbar">
            <button onClick={saveResume}>Save</button>
            <button className="secondary">Undo</button>
            <button className="secondary">Redo</button>
            <button className="secondary">Tailor resume</button>
            <button className="secondary">ATS analysis</button>
            <button className="secondary">Export PDF</button>
          </div>

          <div className="resume-editor-heading">
            <div>
              <p className="eyebrow">CURRENT VERSION</p>
              <h2>{selectedResume.title}</h2>
              <p className="muted">{selectedResume.subtitle}</p>
            </div>

            <span className="badge">Updated {selectedResume.updated}</span>
          </div>

          <textarea
            className="resume-document-editor"
            value={selectedResume.content}
            onChange={(event) => updateContent(event.target.value)}
            spellCheck
          />
        </main>

        <aside className="resume-coach-panel">
          <p className="eyebrow">AI RESUME COACH</p>
          <h2>Resume analysis</h2>

          <div className="resume-score-circle">
            <strong>{selectedResume.atsScore}</strong>
            <span>overall score</span>
          </div>

          <h3>Recommended improvements</h3>

          <div className="resume-coach-list">
            {suggestions.map((suggestion) => (
              <p key={suggestion}>✓ {suggestion}</p>
            ))}
          </div>

          <h3>Missing keywords</h3>

          <div className="resume-keywords">
            {missingKeywords.map((keyword) => (
              <span className="badge" key={keyword}>
                {keyword}
              </span>
            ))}
          </div>

          <h3>AI actions</h3>

          <div className="resume-ai-actions">
            <button>Improve selected bullet</button>
            <button className="secondary">Rewrite executive style</button>
            <button className="secondary">ATS optimize</button>
            <button className="secondary">Generate achievement</button>
            <button className="secondary">Shorten section</button>
          </div>
        </aside>
      </section>
    </>
  );
}