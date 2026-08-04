"use client";
import {useEffect,useState} from "react";
import {api} from "@/lib/api";

const DAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const FREQUENCIES=["instant","daily","weekdays","weekly","manual"];

export default function AutomationSettings(){
 const [form,setForm]=useState<any>(null),[status,setStatus]=useState<any>(null),[busy,setBusy]=useState(false),[running,setRunning]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 async function load(){const [preferences,scheduler]=await Promise.all([api("/api/automation/preferences"),api("/api/automation/scheduler/status")]);setForm(preferences);setStatus(scheduler)}
 useEffect(()=>{load().catch(e=>setError(e.message))},[]);
 function set(key:string,value:any){setForm((current:any)=>({...current,[key]:value}));setMessage("")}
 async function save(){setBusy(true);setError("");try{const updated=await api("/api/automation/preferences",{method:"PATCH",body:JSON.stringify(form)});setForm(updated);setMessage("Automation preferences saved.")}catch(e){setError(e instanceof Error?e.message:"Could not save preferences")}finally{setBusy(false)}}
 async function runNow(){setRunning(true);setError("");try{const result=await api("/api/automation/scheduler/run-now",{method:"POST"});const scheduler=await api("/api/automation/scheduler/status");setStatus(scheduler);setMessage(`Automation completed: ${result.searches_run||0} searches and ${(result.follow_ups_created||0)+(result.interview_reminders_created||0)+(result.daily_briefs_created||0)+(result.weekly_reports_created||0)} notifications created.`)}catch(e){setError(e instanceof Error?e.message:"Could not run automation")}finally{setRunning(false)}}
 if(!form)return <p>{error||"Loading automation preferences…"}</p>;
 return <>
  <div className="hero"><p className="eyebrow">AUTOMATION CONTROL</p><h1>Automation preferences</h1><p className="muted">Control when CareerOS searches, reminds, and prepares reports. These settings are stored with your account.</p></div>
  <section className="card"><div className="row between wrap"><div><h2>Background scheduler</h2><p className="muted">CareerOS checks due work every 15 minutes and respects your time zone and quiet hours.</p></div><button className="secondary" onClick={runNow} disabled={running}>{running?"Running…":"Run my automation now"}</button></div><div className="metrics-grid"><div className="metric-card"><span>Status</span><strong>{status?.running?"Running":"Stopped"}</strong></div><div className="metric-card"><span>Next check</span><strong>{status?.next_run_at?new Date(status.next_run_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}):"Not scheduled"}</strong></div><div className="metric-card"><span>Last completed</span><strong>{status?.last_finished_at?new Date(status.last_finished_at).toLocaleString():"Not yet"}</strong></div><div className="metric-card"><span>Last cycle</span><strong>{status?.last_result?.searches_run||0} searches</strong></div></div>{status?.last_error&&<p className="error">Last scheduler error: {status.last_error}</p>}</section>
  <div className="two-col">
   <section className="card"><h2>Briefings and reports</h2>
    <label><input type="checkbox" checked={form.daily_brief_enabled} onChange={e=>set("daily_brief_enabled",e.target.checked)}/> Daily briefing enabled</label>
    <label>Daily briefing hour</label><select value={form.daily_brief_hour} onChange={e=>set("daily_brief_hour",Number(e.target.value))}>{Array.from({length:24},(_,h)=><option key={h} value={h}>{String(h).padStart(2,"0")}:00</option>)}</select>
    <label><input type="checkbox" checked={form.weekly_report_enabled} onChange={e=>set("weekly_report_enabled",e.target.checked)}/> Weekly report enabled</label>
    <label>Weekly report day</label><select value={form.weekly_report_day} onChange={e=>set("weekly_report_day",Number(e.target.value))}>{DAYS.map((d,i)=><option key={d} value={i}>{d}</option>)}</select>
    <label>Weekly report hour</label><select value={form.weekly_report_hour} onChange={e=>set("weekly_report_hour",Number(e.target.value))}>{Array.from({length:24},(_,h)=><option key={h} value={h}>{String(h).padStart(2,"0")}:00</option>)}</select>
   </section>
   <section className="card"><h2>Search and follow-up timing</h2>
    <label>Time zone</label><input value={form.timezone} onChange={e=>set("timezone",e.target.value)}/>
    <label>Default saved-search cadence</label><select value={form.default_search_cadence} onChange={e=>set("default_search_cadence",e.target.value)}>{FREQUENCIES.slice(1).map(x=><option key={x}>{x}</option>)}</select>
    <label>Job-alert frequency</label><select value={form.job_alert_frequency} onChange={e=>set("job_alert_frequency",e.target.value)}>{FREQUENCIES.map(x=><option key={x}>{x}</option>)}</select>
    <label>Application follow-up after {form.application_follow_up_days} days</label><input type="range" min="1" max="30" value={form.application_follow_up_days} onChange={e=>set("application_follow_up_days",Number(e.target.value))}/>
    <label>Interview reminders</label><input value={(form.interview_reminder_hours||[]).join(", ")} onChange={e=>set("interview_reminder_hours",e.target.value.split(",").map(Number).filter(Boolean))}/><small>Hours before an interview, comma separated.</small>
   </section>
  </div>
  <div className="two-col">
   <section className="card"><h2>Quiet hours</h2><label>Start</label><select value={form.quiet_hours_start} onChange={e=>set("quiet_hours_start",Number(e.target.value))}>{Array.from({length:24},(_,h)=><option key={h} value={h}>{String(h).padStart(2,"0")}:00</option>)}</select><label>End</label><select value={form.quiet_hours_end} onChange={e=>set("quiet_hours_end",Number(e.target.value))}>{Array.from({length:24},(_,h)=><option key={h} value={h}>{String(h).padStart(2,"0")}:00</option>)}</select></section>
   <section className="card"><h2>Notification categories</h2>{Object.entries(form.notification_categories||{}).map(([key,value])=><label key={key}><input type="checkbox" checked={Boolean(value)} onChange={e=>set("notification_categories",{...form.notification_categories,[key]:e.target.checked})}/> {key[0].toUpperCase()+key.slice(1)}</label>)}</section>
  </div>
  {error&&<p className="error">{error}</p>}{message&&<p className="success">{message}</p>}<button onClick={save} disabled={busy}>{busy?"Saving…":"Save preferences"}</button>
 </>;
}
