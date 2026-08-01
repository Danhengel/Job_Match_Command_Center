"use client";
import {useEffect,useState,use} from "react";
import Link from "next/link";
import {api,uploadApi} from "@/lib/api";
type P={id:number;name:string;home_location:string;salary_target:number|null;target_titles:string[];priority_keywords:string[];resume_count:number;completeness:number;best_resume_score:number};
type R={id:number;name:string;original_filename:string;file_size:number;is_primary:boolean;extracted_text_preview:string;analysis_score:number|null;strengths:string[];gaps:string[];metrics_found:string[];analysis_summary:string};
export default function ProfileDetail({params}:{params:Promise<{id:string}>}){
 const {id}=use(params);const [p,setP]=useState<P|null>(null),[resumes,setResumes]=useState<R[]>([]),[file,setFile]=useState<File|null>(null),[resumeName,setResumeName]=useState("Primary Resume"),[error,setError]=useState(""),[busy,setBusy]=useState(false),[analyzing,setAnalyzing]=useState<number|null>(null);
 const load=async()=>{const [profile,rs]=await Promise.all([api(`/api/profiles/${id}`),api(`/api/resumes/profile/${id}`)]);setP(profile);setResumes(rs)};
 useEffect(()=>{void load().catch(e=>setError(e.message))},[id]);
 async function upload(e:React.FormEvent){e.preventDefault();if(!file)return;setBusy(true);setError("");try{const fd=new FormData();fd.append("profile_id",id);fd.append("name",resumeName);fd.append("make_primary","true");fd.append("file",file);await uploadApi("/api/resumes/upload",fd);setFile(null);await load()}catch(err){setError(err instanceof Error?err.message:"Upload failed")}finally{setBusy(false)}}
 async function analyze(rid:number){setAnalyzing(rid);try{await api(`/api/resumes/${rid}/analyze`,{method:"POST"});await load()}catch(e){setError(e instanceof Error?e.message:"Analysis failed")}finally{setAnalyzing(null)}}
 async function primary(rid:number){await api(`/api/resumes/${rid}/primary`,{method:"POST"});await load()}
 async function remove(rid:number){if(!confirm("Delete this résumé version?"))return;await api(`/api/resumes/${rid}`,{method:"DELETE"});await load()}
 if(!p)return <p>Loading…</p>;
 return <><div className="hero row between"><div><p className="eyebrow">CAREER PROFILE</p><h1>{p.name}</h1><p className="muted">{p.home_location} · {p.salary_target?`Target $${p.salary_target.toLocaleString()}`:"Salary target not set"}</p></div><div className="row"><span className="score-ring">{p.completeness}%<small>complete</small></span><Link className="button secondary" href={`/profiles/${id}/edit`}>Edit profile</Link></div></div>
 <div className="grid"><div className="card"><h2>Target roles</h2>{p.target_titles.map(x=><span className="badge" key={x}>{x}</span>)}</div><div className="card"><h2>Priority evidence</h2><p>{p.priority_keywords.join(" · ")||"No keywords defined"}</p></div><div className="card"><h2>Best résumé score</h2><strong className="large-score">{p.best_resume_score||"—"}</strong><p className="muted">Evidence score, not a hiring prediction.</p></div></div>
 <div className="card"><h2>Upload résumé version</h2><p className="muted">PDF, DOCX, or TXT; maximum 10 MB. Uploaded files remain private.</p><form onSubmit={upload}><label>Version name</label><input value={resumeName} onChange={e=>setResumeName(e.target.value)}/><input type="file" accept=".pdf,.docx,.txt" onChange={e=>setFile(e.target.files?.[0]||null)} required/>{error&&<p className="error">{error}</p>}<button disabled={busy}>{busy?"Uploading…":"Upload and extract"}</button></form></div>
 <h2>Résumé Versions</h2>{resumes.map(r=><div className="card resume-card" key={r.id}><div className="row between"><div><h3>{r.name} {r.is_primary&&<span className="badge">Primary</span>}</h3><p className="muted">{r.original_filename} · {(r.file_size/1024).toFixed(1)} KB</p></div><div className="row">{r.analysis_score!==null&&<span className="score-pill">{r.analysis_score}/100</span>}<button onClick={()=>analyze(r.id)} disabled={analyzing===r.id}>{analyzing===r.id?"Analyzing…":r.analysis_score===null?"Analyze résumé":"Reanalyze"}</button>{!r.is_primary&&<button className="secondary" onClick={()=>primary(r.id)}>Make primary</button>}<button className="danger" onClick={()=>remove(r.id)}>Delete</button></div></div>
 {r.analysis_score!==null&&<div className="analysis-grid"><div><h4>Strengths</h4>{r.strengths.map(x=><div className="analysis-item good" key={x}>✓ {x}</div>)}</div><div><h4>Evidence gaps</h4>{r.gaps.map(x=><div className="analysis-item warn" key={x}>• {x}</div>)}</div></div>}
 {r.analysis_summary&&<p className="muted">{r.analysis_summary}</p>}
 {r.metrics_found.length>0&&<div><h4>Metrics detected</h4>{r.metrics_found.map(x=><span className="badge metric-badge" key={x}>{x}</span>)}</div>}
 <details><summary>Extracted text preview</summary><p className="muted preview">{r.extracted_text_preview}</p></details></div>)}
 {!resumes.length&&<div className="card empty"><h3>No résumé versions yet</h3><p className="muted">Upload your first résumé above.</p></div>}</>;
}
