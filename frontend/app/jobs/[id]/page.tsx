"use client";
import {useEffect,useState} from "react";
import {useParams,useSearchParams} from "next/navigation";
import {api,downloadApi} from "@/lib/api";

type Resume={id:number;name:string;is_primary:boolean;analysis_score:number|null};
type Version={id:number;version_name:string;ats_score:number;professional_summary:string;tailored_text:string;selected_evidence:string[];matched_keywords:string[];missing_keywords:string[];recommendations:string[];cover_letter:string;created_at:string};
type Workspace={
 profile:{id:number;name:string;priority_keywords:string[]};
 job:{id:number;title:string;company:string;location:string;description:string;url:string;salary:string;source:string;remote:boolean};
 match:null|{score:number;title_score:number;keyword_score:number;location_score:number;resume_score:number;matched_keywords:string[];missing_keywords:string[];concerns:string[];explanation:string};
 resumes:Resume[];
 versions:Version[];
};

export default function JobWorkspace(){
 const params=useParams<{id:string}>(),search=useSearchParams();
 const profileId=search.get("profile_id")||"";
 const [data,setData]=useState<Workspace|null>(null),[resumeId,setResumeId]=useState(""),[versionName,setVersionName]=useState("");
 const [active,setActive]=useState<Version|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[applicationId,setApplicationId]=useState<number|null>(null);
 const jobId=params.id;

 async function load(){
  const result=await api(`/api/tailoring/job/${jobId}?profile_id=${profileId}`);
  setData(result);
  if(result.resumes[0]&&!resumeId)setResumeId(String(result.resumes[0].id));
  if(result.versions[0])setActive(result.versions[0]);
 }
 useEffect(()=>{if(profileId)load().catch(e=>setError(e.message))},[jobId,profileId]);


 async function generate(){
  setBusy(true);setError("");
  try{
   const item=await api("/api/tailoring/generate",{method:"POST",body:JSON.stringify({
    profile_id:Number(profileId),job_id:Number(jobId),resume_id:Number(resumeId),
    version_name:versionName||undefined
   })});
   setActive(item);await load();
  }catch(e){setError(e instanceof Error?e.message:"Tailoring failed")}finally{setBusy(false)}
 }
 async function cover(){
  if(!active)return;
  setBusy(true);setError("");
  try{
   const item=await api(`/api/tailoring/${active.id}/cover-letter`,{method:"POST",body:JSON.stringify({tone:"executive"})});
   setActive(item);await load();
  }catch(e){setError(e instanceof Error?e.message:"Cover letter failed")}finally{setBusy(false)}
 }

 async function saveApplication(status="wishlist") {
  setBusy(true);setError("");
  try { const item=await api("/api/applications",{method:"POST",body:JSON.stringify({profile_id:Number(profileId),job_id:Number(jobId),tailoring_id:active?.id||undefined,status})}); setApplicationId(item.id); }
  catch(e){setError(e instanceof Error?e.message:"Application save failed")} finally{setBusy(false)}
 }
 async function copy(text:string){await navigator.clipboard.writeText(text)}
 if(!profileId)return <div className="card"><h2>Career direction required</h2><p>Open this opportunity from the Opportunity Map.</p></div>;
 if(!data)return <div className="card"><h2>Loading opportunity workspace…</h2>{error&&<p className="error">{error}</p>}</div>;

 return <><div className="hero"><p className="eyebrow">OPPORTUNITY ROUTE</p><h1>{data.job.title}</h1><p className="muted">{data.job.company} · {data.job.location||"Location not listed"} · {data.job.source}</p><div className="row wrap"><a className="button secondary" href={data.job.url} target="_blank">Original posting</a><button onClick={()=>saveApplication("wishlist")} disabled={busy}>Add to tracker</button><button onClick={()=>saveApplication("applied")} disabled={busy}>Mark applied</button>{applicationId&&<a className="button secondary" href={`/applications/${applicationId}`}>Open application route</a>}{data.job.salary&&<span className="badge metric-badge">{data.job.salary}</span>}</div></div>
 {error&&<div className="card"><p className="error">{error}</p></div>}
 <div className="two-col tailor-layout"><div>
  <div className="card"><div className="row between"><h2>Alignment analysis</h2>{data.match&&<div className="job-score">{data.match.score}<small>alignment</small></div>}</div>
  {data.match?<><p>{data.match.explanation}</p><div className="score-bars"><span>Title <b>{data.match.title_score}</b></span><span>Keywords <b>{data.match.keyword_score}</b></span><span>Location <b>{data.match.location_score}</b></span><span>Résumé <b>{data.match.resume_score}</b></span></div><p><strong>Aligned evidence:</strong> {data.match.matched_keywords.join(" · ")||"None"}</p><p className="warn-text"><strong>Review:</strong> {data.match.concerns.join(" · ")||"No flags"}</p></>:<p className="muted">No saved alignment score is available.</p>}</div>
  <div className="card"><h2>Job description</h2><div className="job-description">{data.job.description||"No description was returned by the provider."}</div></div>
 </div>
 <div>
  <div className="card"><h2>Generate evidence-based résumé draft</h2><p className="muted">The engine only selects and reorganizes evidence found in the uploaded résumé. Verify every statement before use.</p>
   <label>Source résumé</label><select value={resumeId} onChange={e=>setResumeId(e.target.value)}>{data.resumes.map(r=><option key={r.id} value={r.id}>{r.name}{r.is_primary?" · Primary":""}</option>)}</select>
   <label>Version name</label><input value={versionName} onChange={e=>setVersionName(e.target.value)} placeholder={`${data.job.company} - ${data.job.title}`}/>
   <button disabled={busy||!resumeId} onClick={generate}>{busy?"Working…":"Tailor résumé"}</button>
  </div>
  <div className="card"><h2>Saved versions</h2>{data.versions.map(v=><button className="version-button" key={v.id} onClick={()=>setActive(v)}><strong>{v.version_name}</strong><span>{v.ats_score} ATS · {new Date(v.created_at).toLocaleDateString()}</span></button>)}{!data.versions.length&&<p className="muted">No tailored versions yet.</p>}</div>
 </div></div>
 {active&&<div className="card tailoring-output"><div className="row between"><div><p className="eyebrow">TAILORED VERSION</p><h2>{active.version_name}</h2></div><div className="job-score">{active.ats_score}<small>ATS</small></div></div>
  <h3>Professional summary</h3><p>{active.professional_summary}</p>
  <h3>Selected evidence</h3>{active.selected_evidence.map((x,i)=><p key={i}>• {x}</p>)}
  <h3>Aligned evidence terms</h3><div className="row wrap">{active.matched_keywords.map(x=><span className="badge" key={x}>{x}</span>)}</div>
  <h3>Keywords requiring verification</h3><div className="row wrap">{active.missing_keywords.map(x=><span className="badge warning-badge" key={x}>{x}</span>)}</div>
  <h3>Recommendations</h3>{active.recommendations.map((x,i)=><p key={i}>• {x}</p>)}
  <div className="row wrap"><button onClick={()=>copy(active.tailored_text)}>Copy résumé draft</button><button className="secondary" onClick={cover}>{active.cover_letter?"Regenerate cover letter":"Generate cover letter"}</button><button className="secondary" onClick={()=>downloadApi(`/api/tailoring/${active.id}/download.txt`,`tailored_resume_${active.id}.txt`)}>TXT</button><button className="secondary" onClick={()=>downloadApi(`/api/tailoring/${active.id}/download.docx`,`tailored_resume_${active.id}.docx`)}>DOCX</button><button className="secondary" onClick={()=>downloadApi(`/api/tailoring/${active.id}/download.pdf`,`tailored_resume_${active.id}.pdf`)}>PDF</button></div>
  {active.cover_letter&&<><h3>Cover letter</h3><div className="letter-preview">{active.cover_letter}</div><button onClick={()=>copy(active.cover_letter)}>Copy cover letter</button></>}
 </div>}
 </>;
}
