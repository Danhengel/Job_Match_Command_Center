"use client";
import {useEffect,useState} from "react";
import {api} from "@/lib/api";

export default function Coach(){
 const [profiles,setProfiles]=useState<any[]>([]),[apps,setApps]=useState<any[]>([]);
 const [profileId,setProfileId]=useState(""),[applicationId,setApplicationId]=useState("");
 const [question,setQuestion]=useState("Should I apply to this role?"),[history,setHistory]=useState<any[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 async function load(){
  const [p,a,h]=await Promise.all([api("/api/profiles"),api("/api/applications"),api("/api/intelligence/coach/history")]);
  setProfiles(p);setApps(a.applications);setHistory(h);
 }
 useEffect(()=>{load().catch(e=>setError(e.message))},[]);
 async function ask(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError("");
  try{
   await api("/api/intelligence/coach",{method:"POST",body:JSON.stringify({question,profile_id:profileId?Number(profileId):null,application_id:applicationId?Number(applicationId):null})});
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Coach request failed")}
  finally{setBusy(false)}
 }
 return <><div className="hero"><p className="eyebrow">CAREER COACH</p><h1>Ask about your search</h1><p className="muted">Answers are grounded in saved profiles, matches, tailoring evidence, and applications.</p></div><div className="two-col"><form className="card" onSubmit={ask}><label>Career profile</label><select value={profileId} onChange={e=>setProfileId(e.target.value)}><option value="">General guidance</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><label>Application context</label><select value={applicationId} onChange={e=>setApplicationId(e.target.value)}><option value="">No application selected</option>{apps.map((a:any)=><option key={a.id} value={a.id}>{a.job.company} - {a.job.title}</option>)}</select><label>Question</label><textarea rows={8} value={question} onChange={e=>setQuestion(e.target.value)}/>{error&&<p className="error">{error}</p>}<button disabled={busy}>{busy?"Thinking…":"Ask coach"}</button></form><section className="card"><h2>Useful questions</h2>{["Should I apply to this role?","How should I prepare for the interview?","What salary strategy should I use?","What is the next priority in my search?","How should I improve the resume?"].map(x=><button className="version-button" key={x} onClick={()=>setQuestion(x)}>{x}</button>)}</section></div><section className="card"><h2>Coach history</h2>{history.map(h=><article className="coach-message" key={h.id}><strong>{h.question}</strong><p>{h.answer}</p><small>{new Date(h.created_at).toLocaleString()}</small></article>)}{!history.length&&<p className="muted">No coach conversations yet.</p>}</section></>;
}
