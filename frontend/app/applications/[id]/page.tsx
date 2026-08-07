"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ExecutivePanel, MetricStrip, Notice, PageHeader, SectionHeader } from "@/components/ui";
import { api } from "@/lib/api";

export default function ApplicationDetail() {
  const { id } = useParams<{id:string}>();
  const [d, setD] = useState<any>(null);
  const [pkg, setPkg] = useState<any>(null);
  const [matchExplanation, setMatchExplanation] = useState<any>(null);
  const [checklist, setChecklist] = useState<any>(null);
  const [salaryPlan, setSalaryPlan] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const app = await api(`/api/applications/${id}`);
    setD(app);
    const optionalResults = await Promise.allSettled([
      api(`/api/intelligence/applications/${id}/package`),
      api(`/api/recruiting/applications/${id}/match-explanation`),
      api(`/api/recruiting/applications/${id}/apply-checklist`),
      api(`/api/recruiting/applications/${id}/salary-plan`),
    ]);
    if (optionalResults[0].status === "fulfilled") setPkg(optionalResults[0].value);
    if (optionalResults[1].status === "fulfilled") setMatchExplanation(optionalResults[1].value);
    if (optionalResults[2].status === "fulfilled") setChecklist(optionalResults[2].value);
    if (optionalResults[3].status === "fulfilled") setSalaryPlan(optionalResults[3].value);
  }

  useEffect(() => { load().catch((e) => setError(e.message)); }, [id]);

  async function update(values:any) {
    setBusy(true);
    try { await api(`/api/applications/${id}`, { method:"PATCH", body:JSON.stringify(values) }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Update failed"); }
    finally { setBusy(false); }
  }

  async function prep() {
    setBusy(true);
    try { await api(`/api/applications/${id}/interview-prep`, { method:"POST" }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Prep failed"); }
    finally { setBusy(false); }
  }

  async function generatePackage() {
    setBusy(true);
    try { setPkg(await api(`/api/intelligence/applications/${id}/package`, { method:"POST" })); }
    catch (e) { setError(e instanceof Error ? e.message : "Package generation failed"); }
    finally { setBusy(false); }
  }

  async function generateSalaryPlan() {
    setBusy(true); setError("");
    try { setSalaryPlan(await api(`/api/recruiting/applications/${id}/salary-plan`, { method:"POST", body:JSON.stringify({}) })); }
    catch (e) { setError(e instanceof Error ? e.message : "Salary plan failed"); }
    finally { setBusy(false); }
  }

  async function exportPackage() {
    setBusy(true); setError("");
    try { const result = await api(`/api/enterprise/applications/${id}/export`, { method:"POST" }); alert(`Application package manifest created. Export ID: ${result.id}`); }
    catch (e) { setError(e instanceof Error ? e.message : "Export failed"); }
    finally { setBusy(false); }
  }

  async function copy(text:string) { await navigator.clipboard.writeText(text); }

  if (!d) return <ExecutivePanel><p className="eyebrow">OPPORTUNITY PORTFOLIO</p><h2>Loading application…</h2></ExecutivePanel>;
  const p = d.interview_prep;

  return <>
    <PageHeader
      eyebrow="OPPORTUNITY PORTFOLIO"
      title={d.job.title}
      description={`${d.job.company} · ${d.job.location || "Location not listed"}`}
      actions={<div className="row wrap">
        <Link className="button secondary" href="/applications">Back to portfolio</Link>
        <a className="button secondary" href={d.job.url} target="_blank" rel="noreferrer">Original posting</a>
        <button onClick={prep} disabled={busy}>{p ? "Refresh interview prep" : "Generate interview prep"}</button>
      </div>}
    />

    {error ? <Notice title="Application workspace needs attention" tone="error"><p>{error}</p></Notice> : null}

    <MetricStrip
      ariaLabel="Application summary"
      items={[
        { label:"Current stage", value:String(d.status || "Saved").replaceAll("_", " "), detail:"portfolio status" },
        { label:"Alignment", value:d.match_score != null ? `${d.match_score}%` : "—", detail:"evidence-based fit" },
        { label:"ATS preparation", value:d.tailoring?.ats_score ?? "—", detail:d.tailoring ? "tailored résumé" : "no tailored version" },
        { label:"Next action", value:d.next_action || "—", detail:d.next_action ? "recorded priority" : "not set" },
      ]}
    />

    <section className="two-col">
      <ExecutivePanel>
        <SectionHeader eyebrow="APPLICATION MANAGEMENT" title="Portfolio details" description="Keep status, relationship information, next action, and notes current." />
        <label>Status</label>
        <select value={d.status} onChange={(e) => update({ status:e.target.value })}>{["wishlist","applied","recruiter","interview","final","offer","accepted","rejected"].map((x) => <option key={x}>{x}</option>)}</select>
        <label>Recruiter name</label><input defaultValue={d.recruiter_name} onBlur={(e) => update({ recruiter_name:e.target.value })} />
        <label>Recruiter email</label><input defaultValue={d.recruiter_email} onBlur={(e) => update({ recruiter_email:e.target.value })} />
        <label>Next action</label><input defaultValue={d.next_action} onBlur={(e) => update({ next_action:e.target.value })} />
        <label>Notes</label><textarea rows={8} defaultValue={d.notes} onBlur={(e) => update({ notes:e.target.value })} />
      </ExecutivePanel>

      <ExecutivePanel>
        <SectionHeader eyebrow="APPLICATION ASSETS" title="Positioning package" description="Generate or refresh the decision, compensation, and application materials for this opportunity." />
        <p><strong>Résumé:</strong> {d.tailoring?.version_name || "No tailored résumé attached"}</p>
        <p><strong>ATS preparation:</strong> {d.tailoring?.ats_score ?? "Not scored"}</p>
        <div className="row wrap">
          <button onClick={generatePackage} disabled={busy}>{pkg ? "Refresh full package" : "Generate full package"}</button>
          <button className="secondary" onClick={generateSalaryPlan} disabled={busy}>Compensation strategy</button>
          <button className="secondary" onClick={exportPackage} disabled={busy}>Create package manifest</button>
        </div>
      </ExecutivePanel>
    </section>

    {matchExplanation ? <ExecutivePanel>
      <SectionHeader eyebrow="ALIGNMENT EXPLANATION" title={matchExplanation.recommendation} description="A transparent view of the factors contributing to this opportunity score." />
      <div className="score-bars"><span>Title <b>{matchExplanation.details.title}</b></span><span>Keywords <b>{matchExplanation.details.keywords}</b></span><span>Location <b>{matchExplanation.details.location}</b></span><span>Résumé <b>{matchExplanation.details.resume}</b></span></div>
      <div className="two-col"><div><h3>Strengths</h3>{matchExplanation.strengths.map((x:string, i:number) => <p key={i}>✓ {x}</p>)}</div><div><h3>Gaps</h3>{matchExplanation.gaps.map((x:string, i:number) => <p className="warn-text" key={i}>• {x}</p>)}</div></div>
    </ExecutivePanel> : null}

    {checklist ? <ExecutivePanel>
      <SectionHeader eyebrow="APPLICATION READINESS" title="Submission checklist" description="Confirm the core materials before submitting." />
      {checklist.checklist.map((x:any, i:number) => <div className="analytics-row" key={i}><span>{x.item}</span><b>{x.complete ? "Ready" : "Pending"}</b></div>)}
    </ExecutivePanel> : null}

    {salaryPlan ? <ExecutivePanel>
      <SectionHeader eyebrow="COMPENSATION STRATEGY" title="Negotiation framework" description="Use recorded targets and role context to prepare a structured compensation conversation." />
      <MetricStrip items={[
        { label:"Target base", value:salaryPlan.target_base ? `$${salaryPlan.target_base.toLocaleString()}` : "—" },
        { label:"Minimum base", value:salaryPlan.minimum_base ? `$${salaryPlan.minimum_base.toLocaleString()}` : "—" },
        { label:"Target bonus", value:`${salaryPlan.target_bonus_pct}%` },
        { label:"Total comp", value:salaryPlan.total_comp_target ? `$${salaryPlan.total_comp_target.toLocaleString()}` : "—" },
      ]} />
      <h3>Rationale</h3>{salaryPlan.rationale.map((x:string, i:number) => <p key={i}>• {x}</p>)}
      <h3>Negotiation points</h3>{salaryPlan.negotiation_points.map((x:string, i:number) => <p key={i}>• {x}</p>)}
    </ExecutivePanel> : null}

    {pkg ? <ExecutivePanel>
      <SectionHeader eyebrow="APPLICATION PACKAGE" title={pkg.fit_recommendation} description={pkg.fit_summary} />
      <div className="two-col"><div><h3>Strengths</h3>{pkg.strengths.map((x:string, i:number) => <p key={i}>✓ {x}</p>)}</div><div><h3>Gaps to review</h3>{pkg.gaps.map((x:string, i:number) => <p className="warn-text" key={i}>• {x}</p>)}</div></div>
      <h3>Positioning summary</h3><p>{pkg.executive_summary}</p>
      <div className="two-col"><div><h3>Recruiter email</h3><pre className="letter-preview">{pkg.recruiter_email}</pre><button onClick={() => copy(pkg.recruiter_email)}>Copy email</button></div><div><h3>LinkedIn message</h3><pre className="letter-preview">{pkg.linkedin_message}</pre><button onClick={() => copy(pkg.linkedin_message)}>Copy message</button></div></div>
      <h3>30/60/90-day plan</h3>{pkg.plan_30_60_90.map((x:any, i:number) => <div className="prep-item" key={i}><strong>{x.period}</strong><p>{x.focus}</p></div>)}
      <h3>Salary strategy</h3>{pkg.salary_strategy.map((x:string, i:number) => <p key={i}>• {x}</p>)}
    </ExecutivePanel> : null}

    {p ? <ExecutivePanel>
      <SectionHeader eyebrow="INTERVIEW ADVISORY" title="Interview preparation" description="Use these prompts as preparation material and tailor them to the actual conversation." />
      <h3>Opening statement</h3><p>{p.opening_statement}</p>
      <h3>Likely questions</h3>{p.questions.map((q:any, i:number) => <div className="prep-item" key={i}><strong>{q.question}</strong><p>{q.guidance}</p></div>)}
      <h3>STAR story prompts</h3>{p.star_prompts.map((q:any, i:number) => <div className="prep-item" key={i}><strong>{q.theme}</strong><p>{q.prompt}</p>{q.evidence ? <small>Evidence: {q.evidence}</small> : null}</div>)}
      <h3>Questions to ask</h3>{p.questions_to_ask.map((x:string, i:number) => <p key={i}>• {x}</p>)}
      <h3>Negotiation points</h3>{p.negotiation_points.map((x:string, i:number) => <p key={i}>• {x}</p>)}
      <h3>Thank-you email</h3><pre className="letter-preview">{p.thank_you_email}</pre>
    </ExecutivePanel> : null}
  </>;
}
