"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import {api} from "@/lib/api";

export default function ApplicationDetail(){
 const {id}=useParams<{id:string}>();
 const [d,setD]=useState<any>(null),[pkg,setPkg]=useState<any>(null),[matchExplanation,setMatchExplanation]=useState<any>(null),[checklist,setChecklist]=useState<any>(null),[salaryPlan,setSalaryPlan]=useState<any>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");

 async function load(){
  const [app,packageData,explanation,checklistData,salaryData]=await Promise.all([
   api(`/api/applications/${id}`),
   api(`/api/intelligence/applications/${id}/package`),
   api(`/api/recruiting/applications/${id}/match-explanation`),
   api(`/api/recruiting/applications/${id}/apply-checklist`),
   api(`/api/recruiting/applications/${id}/salary-plan`)
  ]);
  setD(app);setPkg(packageData);setMatchExplanation(explanation);setChecklist(checklistData);setSalaryPlan(salaryData);
 }
 useEffect(()=>{load().catch(e=>setError(e.message))},[id]);

 async function update(values:any){
  setBusy(true);
  try{await api(`/api/applications/${id}`,{method:"PATCH",body:JSON.stringify(values)});await load()}
  catch(e){setError(e instanceof Error?e.message:"Update failed")}
  finally{setBusy(false)}
 }
 async function prep(){
  setBusy(true);
  try{await api(`/api/applications/${id}/interview-prep`,{method:"POST"});await load()}
  catch(e){setError(e instanceof Error?e.message:"Prep failed")}
  finally{setBusy(false)}
 }
 async function generatePackage(){
  setBusy(true);
  try{
   const result=await api(`/api/intelligence/applications/${id}/package`,{method:"POST"});
   setPkg(result);
  }catch(e){setError(e instanceof Error?e.message:"Package generation failed")}
  finally{setBusy(false)}
 }
 async function generateSalaryPlan(){
  setBusy(true);setError("");
  try{
   const result=await api(`/api/recruiting/applications/${id}/salary-plan`,{method:"POST",body:JSON.stringify({})});
   setSalaryPlan(result);
  }catch(e){setError(e instanceof Error?e.message:"Salary plan failed")}
  finally{setBusy(false)}
 }
 async function exportPackage(){setBusy(true);setError("");try{const result=await api(`/api/enterprise/applications/${id}/export`,{method:"POST"});alert(`Executive package manifest created. Export ID: ${result.id}`)}catch(e){setError(e instanceof Error?e.message:"Export failed")}finally{setBusy(false)}}
 async function copy(text:string){await navigator.clipboard.writeText(text)}

 if(!d)return <p>Loading…</p>;
 const p=d.interview_prep;

 return <><div className="hero"><p className="eyebrow">APPLICATION COMMAND CENTER</p><h1>{d.job.title}</h1><p className="muted">{d.job.company} · {d.job.location}</p><div className="row wrap"><a className="button secondary" href={d.job.url} target="_blank">Posting</a><button onClick={prep} disabled={busy}>{p?"Regenerate interview prep":"Generate interview prep"}</button><button onClick={generatePackage} disabled={busy}>{pkg?"Regenerate full package":"Generate full package"}</button><button className="secondary" onClick={generateSalaryPlan} disabled={busy}>Generate salary plan</button><button className="secondary" onClick={exportPackage} disabled={busy}>Create executive package manifest</button></div></div>
 {error&&<p className="error">{error}</p>}
 <div className="two-col"><section className="card"><h2>Pipeline details</h2><label>Status</label><select value={d.status} onChange={e=>update({status:e.target.value})}>{["wishlist","applied","recruiter","interview","final","offer","accepted","rejected"].map(x=><option key={x}>{x}</option>)}</select><label>Recruiter name</label><input defaultValue={d.recruiter_name} onBlur={e=>update({recruiter_name:e.target.value})}/><label>Recruiter email</label><input defaultValue={d.recruiter_email} onBlur={e=>update({recruiter_email:e.target.value})}/><label>Next action</label><input defaultValue={d.next_action} onBlur={e=>update({next_action:e.target.value})}/><label>Notes</label><textarea rows={8} defaultValue={d.notes} onBlur={e=>update({notes:e.target.value})}/></section><section className="card"><h2>Application assets</h2><p><strong>Match:</strong> {d.match_score??"Not scored"}%</p>{d.tailoring?<><p><strong>Résumé:</strong> {d.tailoring.version_name}</p><p><strong>ATS score:</strong> {d.tailoring.ats_score}</p></>:<p className="muted">No tailored résumé attached.</p>}</section></div>

 {matchExplanation&&<section className="card"><div className="row between"><div><p className="eyebrow">MATCH EXPLANATION</p><h2>{matchExplanation.recommendation}</h2></div><div className="job-score">{matchExplanation.overall}<small>match</small></div></div><div className="score-bars"><span>Title <b>{matchExplanation.details.title}</b></span><span>Keywords <b>{matchExplanation.details.keywords}</b></span><span>Location <b>{matchExplanation.details.location}</b></span><span>Résumé <b>{matchExplanation.details.resume}</b></span></div><div className="two-col"><div><h3>Strengths</h3>{matchExplanation.strengths.map((x:string,i:number)=><p key={i}>✓ {x}</p>)}</div><div><h3>Gaps</h3>{matchExplanation.gaps.map((x:string,i:number)=><p className="warn-text" key={i}>• {x}</p>)}</div></div></section>}
 {checklist&&<section className="card"><p className="eyebrow">ONE-CLICK APPLY ASSISTANT</p><h2>Application checklist</h2>{checklist.checklist.map((x:any,i:number)=><div className="analytics-row" key={i}><span>{x.item}</span><b>{x.complete?"Ready":"Pending"}</b></div>)}</section>}
 {salaryPlan&&<section className="card"><p className="eyebrow">SALARY PLANNING</p><h2>Compensation strategy</h2><div className="metrics-grid"><div className="metric-card"><span>Target base</span><strong>{salaryPlan.target_base?`$${salaryPlan.target_base.toLocaleString()}`:"Not set"}</strong></div><div className="metric-card"><span>Minimum base</span><strong>{salaryPlan.minimum_base?`$${salaryPlan.minimum_base.toLocaleString()}`:"Not set"}</strong></div><div className="metric-card"><span>Target bonus</span><strong>{salaryPlan.target_bonus_pct}%</strong></div><div className="metric-card"><span>Total comp target</span><strong>{salaryPlan.total_comp_target?`$${salaryPlan.total_comp_target.toLocaleString()}`:"Not set"}</strong></div></div><h3>Rationale</h3>{salaryPlan.rationale.map((x:string,i:number)=><p key={i}>• {x}</p>)}<h3>Negotiation points</h3>{salaryPlan.negotiation_points.map((x:string,i:number)=><p key={i}>• {x}</p>)}</section>}
 {pkg&&<section className="card"><div className="row between"><div><p className="eyebrow">EXECUTIVE APPLICATION PACKAGE</p><h2>{pkg.fit_recommendation}</h2></div><div className="job-score">{pkg.fit_score}<small>fit</small></div></div><p>{pkg.fit_summary}</p><div className="two-col"><div><h3>Strengths</h3>{pkg.strengths.map((x:string,i:number)=><p key={i}>✓ {x}</p>)}</div><div><h3>Gaps to review</h3>{pkg.gaps.map((x:string,i:number)=><p className="warn-text" key={i}>• {x}</p>)}</div></div><h3>Executive summary</h3><p>{pkg.executive_summary}</p><div className="two-col"><div><h3>Recruiter email</h3><pre className="letter-preview">{pkg.recruiter_email}</pre><button onClick={()=>copy(pkg.recruiter_email)}>Copy email</button></div><div><h3>LinkedIn message</h3><pre className="letter-preview">{pkg.linkedin_message}</pre><button onClick={()=>copy(pkg.linkedin_message)}>Copy message</button></div></div><h3>30/60/90-day plan</h3>{pkg.plan_30_60_90.map((x:any,i:number)=><div className="prep-item" key={i}><strong>{x.period}</strong><p>{x.focus}</p></div>)}<h3>Salary strategy</h3>{pkg.salary_strategy.map((x:string,i:number)=><p key={i}>• {x}</p>)}</section>}

 {p&&<section className="card"><p className="eyebrow">INTERVIEW STUDIO</p><h2>Opening statement</h2><p>{p.opening_statement}</p><h2>Likely questions</h2>{p.questions.map((q:any,i:number)=><div className="prep-item" key={i}><strong>{q.question}</strong><p>{q.guidance}</p></div>)}<h2>STAR story prompts</h2>{p.star_prompts.map((q:any,i:number)=><div className="prep-item" key={i}><strong>{q.theme}</strong><p>{q.prompt}</p>{q.evidence&&<small>Evidence: {q.evidence}</small>}</div>)}<h2>Questions to ask</h2>{p.questions_to_ask.map((x:string,i:number)=><p key={i}>• {x}</p>)}<h2>Negotiation points</h2>{p.negotiation_points.map((x:string,i:number)=><p key={i}>• {x}</p>)}<h2>Thank-you email</h2><pre className="letter-preview">{p.thank_you_email}</pre></section>}</>;
}
