"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {api} from "@/lib/api";

export default function Companies(){
 const [items,setItems]=useState<any[]>([]),[error,setError]=useState("");
 async function load(){setItems(await api("/api/intelligence/companies"))}
 useEffect(()=>{load().catch(e=>setError(e.message))},[]);
 async function watch(company:string,watched:boolean){
  if(watched)await api(`/api/intelligence/companies/watch/${encodeURIComponent(company)}`,{method:"DELETE"});
  else await api("/api/intelligence/companies/watch",{method:"POST",body:JSON.stringify({company,notes:""})});
  await load();
 }
 return <><div className="hero"><p className="eyebrow">COMPANY INTELLIGENCE</p><h1>Companies</h1><p className="muted">Review companies represented in your matched jobs and application pipeline.</p></div>{error&&<p className="error">{error}</p>}<div className="profile-grid">{items.map(c=><article className="card company-card" key={c.company}><div className="row between"><span className="badge">{c.open_job_count} jobs</span><button className={c.watched?"secondary":""} onClick={()=>watch(c.company,c.watched)}>{c.watched?"Watching":"Watch"}</button></div><h2>{c.company}</h2><p className="muted">{c.remote_job_count} remote · {c.salary_listed_count} with salary · {c.application_count} applications</p><p>{c.top_titles.slice(0,3).map((x:any)=>x.title).join(" · ")||"No titles saved"}</p><Link className="button secondary" href={`/companies/${encodeURIComponent(c.company)}`}>Open company</Link></article>)}</div>{!items.length&&<div className="card empty"><h2>No companies yet</h2><p className="muted">Run job searches or save applications to populate company intelligence.</p></div>}</>;
}
