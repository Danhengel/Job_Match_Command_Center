"use client";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import {api} from "@/lib/api";

export default function CompanyDetail(){
 const {company}=useParams<{company:string}>(),[d,setD]=useState<any>(null);
 useEffect(()=>{api(`/api/intelligence/companies/${encodeURIComponent(decodeURIComponent(company))}`).then(setD)},[company]);
 if(!d)return <p>Loading company…</p>;
 return <><div className="hero"><p className="eyebrow">COMPANY WORKSPACE</p><h1>{d.company}</h1><p className="muted">{d.open_job_count} matched jobs · {d.application_count} applications · {d.remote_job_count} remote</p></div><div className="metrics-grid"><div className="metric-card"><span>Matched jobs</span><strong>{d.open_job_count}</strong></div><div className="metric-card"><span>Applications</span><strong>{d.application_count}</strong></div><div className="metric-card"><span>Remote roles</span><strong>{d.remote_job_count}</strong></div><div className="metric-card"><span>Salary listed</span><strong>{d.salary_listed_count}</strong></div></div><section className="card"><h2>Roles in your workspace</h2>{d.jobs.map((j:any)=><article className="history-row" key={j.id}><strong>{j.title}</strong><small>{j.location} · {j.source} {j.salary&&`· ${j.salary}`}</small><a href={j.url} target="_blank">Open posting</a></article>)}</section></>;
}
