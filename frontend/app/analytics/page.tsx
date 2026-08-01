"use client";
import {useEffect,useState} from "react";
import {api} from "@/lib/api";

export default function Analytics(){
 const [d,setD]=useState<any>(null);
 useEffect(()=>{api("/api/intelligence/analytics").then(setD)},[]);
 if(!d)return <p>Loading analytics…</p>;
 return <><div className="hero"><p className="eyebrow">SEARCH PERFORMANCE</p><h1>Analytics</h1><p className="muted">Measure pipeline activity and conversion using your saved data.</p></div><div className="metrics-grid"><div className="metric-card"><span>Total matches</span><strong>{d.total_matches}</strong></div><div className="metric-card"><span>Average match</span><strong>{d.average_match_score}%</strong></div><div className="metric-card"><span>Applications</span><strong>{d.total_applications}</strong></div><div className="metric-card"><span>Interview conversion</span><strong>{d.interview_conversion}%</strong></div></div><div className="two-col"><section className="card"><h2>Application stages</h2>{Object.entries(d.status_counts).map(([k,v])=><div className="analytics-row" key={k}><span>{k}</span><b>{String(v)}</b></div>)}</section><section className="card"><h2>Match-score distribution</h2>{Object.entries(d.score_bands).map(([k,v])=><div className="analytics-row" key={k}><span>{k}</span><b>{String(v)}</b></div>)}</section></div><div className="two-col"><section className="card"><h2>Top companies applied to</h2>{d.top_companies.map((x:any)=><div className="analytics-row" key={x.company}><span>{x.company}</span><b>{x.count}</b></div>)}</section><section className="card"><h2>Top titles applied to</h2>{d.top_titles.map((x:any)=><div className="analytics-row" key={x.title}><span>{x.title}</span><b>{x.count}</b></div>)}</section></div></>;
}
