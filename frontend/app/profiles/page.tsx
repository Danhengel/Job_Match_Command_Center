"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {api} from "@/lib/api";
type Profile={id:number;name:string;home_location:string;remote_preferred:boolean;hybrid_preferred:boolean;target_titles:string[];resume_count:number;primary_resume_id:number|null;completeness:number;best_resume_score:number};
export default function Profiles(){
 const [items,setItems]=useState<Profile[]>([]);const [error,setError]=useState("");
 useEffect(()=>{let active=true;api("/api/profiles").then(x=>{if(active)setItems(x)}).catch(e=>setError(e.message));return()=>{active=false}},[]);
 return <><div className="hero row between"><div><p className="eyebrow">CAREER STRATEGY</p><h1>Career Profiles</h1><p className="muted">Create a focused profile for each career path and résumé strategy.</p></div><Link className="button" href="/profiles/new">Create profile</Link></div>
 {error&&<p className="error">{error}</p>}<div className="profile-grid">{items.map(p=><div className="card profile-card" key={p.id}>
  <div className="row between"><span className="badge">{p.completeness}% complete</span>{p.best_resume_score>0&&<span className="score-pill">{p.best_resume_score} résumé score</span>}</div>
  <h2>{p.name}</h2><p className="muted">{p.home_location||"No location set"} · {p.remote_preferred?"Remote ":""}{p.hybrid_preferred?"Hybrid":""}</p>
  <div className="progress"><span style={{width:`${p.completeness}%`}}/></div>
  <p>{p.target_titles.slice(0,3).join(" · ")||"No target titles yet"}</p>
  <div className="row between"><span className="muted">{p.resume_count} résumé version{p.resume_count===1?"":"s"}</span><Link className="button secondary" href={`/profiles/${p.id}`}>Open</Link></div>
 </div>)}</div>
 {!items.length&&!error&&<div className="card empty"><h2>Create your first profile</h2><p className="muted">Add target titles, preferences, and upload your primary résumé.</p><Link className="button" href="/profiles/new">Get started</Link></div>}</>;
}
