"use client";
import {useEffect,useState} from "react";
import {api} from "@/lib/api";

export default function Automation(){
 const [profiles,setProfiles]=useState<any[]>([]),[items,setItems]=useState<any[]>([]);
 const [profileId,setProfileId]=useState(""),[name,setName]=useState("Daily Executive Search");
 const [titles,setTitles]=useState("Construction Loan Administration\nCommercial Loan Operations\nCRE Loan Operations");
 const [location,setLocation]=useState("Remote"),[minimum,setMinimum]=useState(35);
 const [busy,setBusy]=useState(false),[error,setError]=useState("");

 async function load(){
  const [p,s]=await Promise.all([api("/api/profiles"),api("/api/automation/saved-searches")]);
  setProfiles(p);setItems(s);if(!profileId&&p[0])setProfileId(String(p[0].id));
 }
 useEffect(()=>{load().catch(e=>setError(e.message))},[]);

 async function create(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError("");
  try{
   await api("/api/automation/saved-searches",{method:"POST",body:JSON.stringify({
    profile_id:Number(profileId),name,
    titles:titles.split("\n").map(x=>x.trim()).filter(Boolean),
    location,minimum_score:minimum,use_catalog:true,use_remotive:false,use_jsearch:true,cadence:"daily"
   })});
   await load();
  }catch(e){setError(e instanceof Error?e.message:"Could not save search")}
  finally{setBusy(false)}
 }
 async function run(id:number){
  setBusy(true);try{await api(`/api/automation/saved-searches/${id}/run`,{method:"POST"});await load()}finally{setBusy(false)}
 }
 async function toggle(item:any){
  await api(`/api/automation/saved-searches/${item.id}`,{method:"PATCH",body:JSON.stringify({active:!item.active})});
  await load();
 }
 async function remove(id:number){
  await api(`/api/automation/saved-searches/${id}`,{method:"DELETE"});await load();
 }

 return <><div className="hero"><p className="eyebrow">AUTOMATED DISCOVERY</p><h1>Saved Searches</h1><p className="muted">Run recurring job searches and receive high-match notifications.</p></div>
 <div className="two-col"><form className="card" onSubmit={create}><h2>Create saved search</h2><label>Profile</label><select value={profileId} onChange={e=>setProfileId(e.target.value)}>{profiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><label>Name</label><input value={name} onChange={e=>setName(e.target.value)}/><label>Titles, one per line</label><textarea rows={7} value={titles} onChange={e=>setTitles(e.target.value)}/><label>Location</label><input value={location} onChange={e=>setLocation(e.target.value)}/><label>Minimum score: {minimum}</label><input type="range" min="0" max="100" value={minimum} onChange={e=>setMinimum(Number(e.target.value))}/>{error&&<p className="error">{error}</p>}<button disabled={busy}>Save daily search</button></form>
 <section className="card"><h2>How it works</h2><p className="muted">Active daily searches run automatically at 12:00 UTC. You can also run them manually at any time. New high matches appear in Notifications and the daily digest.</p></section></div>
 <section className="card"><h2>Your saved searches</h2>{items.map(s=><article className="automation-row" key={s.id}><div><strong>{s.name}</strong><small>{s.titles.join(" · ")} · {s.location} · threshold {s.minimum_score}</small><small>Last run: {s.last_run_at?new Date(s.last_run_at).toLocaleString():"Never"} · {s.last_result_count} matches</small></div><div className="row wrap"><span className={`badge ${s.active?"":"warning-badge"}`}>{s.active?"Active":"Paused"}</span><button onClick={()=>run(s.id)} disabled={busy}>Run now</button><button className="secondary" onClick={()=>toggle(s)}>{s.active?"Pause":"Resume"}</button><button className="danger" onClick={()=>remove(s.id)}>Delete</button></div></article>)}{!items.length&&<p className="muted">No saved searches yet.</p>}</section></>;
}
