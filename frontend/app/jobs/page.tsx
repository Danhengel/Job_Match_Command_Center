"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {api} from "@/lib/api";

type Profile={id:number;name:string;target_titles:string[]};
type Result={job:{id:number;title:string;company:string;location:string;url:string;source:string;posted_at:string;salary:string;employment_type:string;remote:boolean};
match:{score:number;title_score:number;keyword_score:number;location_score:number;resume_score:number;matched_keywords:string[];missing_keywords:string[];concerns:string[];explanation:string}};
type History={id:number;searched_sources:string[];query_titles:string[];raw_count:number;unique_count:number;matched_count:number;minimum_score:number;created_at:string};

export default function JobsPage(){
 const [profiles,setProfiles]=useState<Profile[]>([]),[profileId,setProfileId]=useState(""),[titles,setTitles]=useState("");
 const [minimum,setMinimum]=useState(20),[results,setResults]=useState<Result[]>([]),[errors,setErrors]=useState<string[]>([]);
 const [busy,setBusy]=useState(false),[summary,setSummary]=useState(""),[catalog,setCatalog]=useState<{greenhouse:number;lever:number;ashby:number}|null>(null);
 const [history,setHistory]=useState<History[]>([]),[topBelow,setTopBelow]=useState<any[]>([]);
 const [useCatalog,setUseCatalog]=useState(true),[useRemotive,setUseRemotive]=useState(false),[useJSearch,setUseJSearch]=useState(false),[jsearchLocation,setJsearchLocation]=useState("Tampa, Florida or Remote");
 const [greenhouse,setGreenhouse]=useState(""),[lever,setLever]=useState(""),[ashby,setAshby]=useState("");

 const loadHistory=()=>api("/api/jobs/history").then(setHistory).catch(()=>{});
 useEffect(()=>{let active=true;Promise.all([api("/api/profiles"),api("/api/jobs/catalog")]).then(([p,c])=>{if(!active)return;setProfiles(p);setCatalog(c);if(p[0]){setProfileId(String(p[0].id));setTitles((p[0].target_titles||[]).join("\n"))}});void loadHistory();return()=>{active=false}},[]);
 function selectProfile(id:string){setProfileId(id);const p=profiles.find(x=>String(x.id)===id);if(p)setTitles((p.target_titles||[]).join("\n"))}
 async function search(e:React.FormEvent){e.preventDefault();setBusy(true);setErrors([]);setTopBelow([]);try{
  const data=await api("/api/jobs/search",{method:"POST",body:JSON.stringify({
   profile_id:Number(profileId),titles:titles.split("\n").map(x=>x.trim()).filter(Boolean),
   use_remotive:useRemotive,use_catalog:useCatalog,use_jsearch:useJSearch,jsearch_location:jsearchLocation,
   minimum_score:minimum,
   greenhouse_boards:greenhouse.split("\n").map(x=>x.trim()).filter(Boolean),
   lever_boards:lever.split("\n").map(x=>x.trim()).filter(Boolean),
   ashby_boards:ashby.split("\n").map(x=>x.trim()).filter(Boolean)
  })});
  setResults(data.results);setErrors(data.errors||[]);setTopBelow(data.top_below_threshold||[]);
  setSummary(`${data.unique_jobs} unique jobs found · ${data.results.length} above ${minimum} · Cache ${data.cache.connected?"connected":"offline"}`);
  await loadHistory();
 }catch(err){setErrors([err instanceof Error?err.message:"Search failed"])}finally{setBusy(false)}}

 return <><div className="hero"><p className="eyebrow">FINANCIAL SERVICES SEARCH</p><h1>Job Matches</h1><p className="muted">Search a curated employer catalog, optional public sources, and JSearch only when configured.</p></div>
 <div className="two-col jobs-layout"><form className="card" onSubmit={search}><h2>Search settings</h2>
  <label>Career profile</label><select value={profileId} onChange={e=>selectProfile(e.target.value)} required><option value="">Select profile</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
  <label>Target titles, one per line</label><textarea rows={7} value={titles} onChange={e=>setTitles(e.target.value)}/>
  <label>Minimum match score: {minimum}</label><input type="range" min="0" max="100" value={minimum} onChange={e=>setMinimum(Number(e.target.value))}/>
  <div className="source-options">
   <label><input type="checkbox" checked={useCatalog} onChange={e=>setUseCatalog(e.target.checked)}/> Curated employer ATS catalog {catalog&&`(${catalog.greenhouse+catalog.lever+catalog.ashby} boards)`}</label>
   <label><input type="checkbox" checked={useRemotive} onChange={e=>setUseRemotive(e.target.checked)}/> Remotive remote jobs</label>
   <label><input type="checkbox" checked={useJSearch} onChange={e=>setUseJSearch(e.target.checked)}/> JSearch fallback</label>
  </div>
  {useJSearch&&<><label>JSearch location</label><input value={jsearchLocation} onChange={e=>setJsearchLocation(e.target.value)}/><p className="muted">Requires RAPIDAPI_KEY in the project .env file.</p></>}
  <details><summary>Additional company ATS boards</summary>
   <label>Greenhouse board tokens or URLs</label><textarea rows={3} value={greenhouse} onChange={e=>setGreenhouse(e.target.value)}/>
   <label>Lever site names or URLs</label><textarea rows={3} value={lever} onChange={e=>setLever(e.target.value)}/>
   <label>Ashby board names or URLs</label><textarea rows={3} value={ashby} onChange={e=>setAshby(e.target.value)}/>
  </details>
  <button disabled={busy||!profileId}>{busy?"Searching employer systems…":"Search jobs"}</button>
 </form>
 <div><div className="card"><h2>Source strategy</h2><p className="muted">Direct public ATS boards run first. JSearch is optional. Each provider response is cached and duplicates are removed before scoring.</p></div>
 {summary&&<div className="card"><strong>{summary}</strong></div>}
 {errors.length>0&&<div className="card"><h3>Provider notices</h3>{errors.map((e,i)=><p className="error" key={i}>{e}</p>)}</div>}
 <div className="card"><h2>Recent searches</h2>{history.slice(0,5).map(h=><div className="history-row" key={h.id}><strong>{h.unique_count} unique · {h.matched_count} matches</strong><small>{h.searched_sources.join(" + ")||"Custom boards"} · threshold {h.minimum_score}</small></div>)}{!history.length&&<p className="muted">No search history yet.</p>}</div>
 </div></div>

 <div className="results-header row between"><h2>Ranked results</h2><span className="muted">{results.length} matches</span></div>
 {results.map(r=><div className="card job-card" key={`${r.job.source}-${r.job.id}`}><div className="row between"><div><div className="row"><span className="badge">{r.job.source}</span>{r.job.remote&&<span className="badge">Remote</span>}{r.job.salary&&<span className="badge metric-badge">{r.job.salary}</span>}</div><h2>{r.job.title}</h2><p className="muted">{r.job.company} · {r.job.location||"Location not listed"}</p></div><div className="job-score">{r.match.score}<small>match</small></div></div><p>{r.match.explanation}</p><div className="score-bars"><span>Title <b>{r.match.title_score}</b></span><span>Keywords <b>{r.match.keyword_score}</b></span><span>Location <b>{r.match.location_score}</b></span><span>Résumé <b>{r.match.resume_score}</b></span></div>{r.match.matched_keywords.length>0&&<p><strong>Matched:</strong> {r.match.matched_keywords.join(" · ")}</p>}{r.match.concerns.length>0&&<p className="warn-text"><strong>Review:</strong> {r.match.concerns.join(" · ")}</p>}<div className="row"><Link className="button" href={`/jobs/${r.job.id}?profile_id=${profileId}`}>Analyze & tailor</Link><a className="button secondary" href={r.job.url} target="_blank">Open posting</a></div></div>)}

 {!results.length&&topBelow.length>0&&<div className="card"><h2>Closest results below threshold</h2><p className="muted">These roles were found but did not clear your current minimum score.</p>{topBelow.map((x,i)=><div className="history-row" key={i}><strong>{x.score} · {x.title}</strong><small>{x.company} · {x.source}</small></div>)}</div>}
 {!results.length&&!topBelow.length&&<div className="card empty"><h3>No search results yet</h3><p className="muted">Select a profile and run a search.</p></div>}
 </>;
}
