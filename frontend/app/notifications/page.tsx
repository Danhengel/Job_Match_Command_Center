"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {api} from "@/lib/api";

export default function Notifications(){
 const [digest,setDigest]=useState<any>(null),[items,setItems]=useState<any[]>([]);
 async function load(){
  const [d,n]=await Promise.all([api("/api/automation/digest"),api("/api/automation/notifications")]);
  setDigest(d);setItems(n);
 }
 useEffect(()=>{load()},[]);
 async function read(item:any){
  await api(`/api/automation/notifications/${item.id}/read`,{method:"POST"});await load();
 }
 async function readAll(){await api("/api/automation/notifications/read-all",{method:"POST"});await load()}
 if(!digest)return <p>Loading notifications…</p>;
 return <><div className="hero row between"><div><p className="eyebrow">MORNING CAREER DIGEST</p><h1>Notifications</h1><p className="muted">{digest.unread_count} unread items</p></div><button onClick={readAll}>Mark all read</button></div>
 <div className="metrics-grid"><div className="metric-card"><span>High matches</span><strong>{digest.high_matches}</strong></div><div className="metric-card"><span>Search updates</span><strong>{digest.saved_search_updates}</strong></div><div className="metric-card"><span>Follow-ups due</span><strong>{digest.follow_ups_due}</strong></div><div className="metric-card"><span>Unread</span><strong>{digest.unread_count}</strong></div></div>
 <section className="card">{items.map(n=><article className={`notification-row ${n.read?"read":""}`} key={n.id}><div><span className="badge">{n.kind}</span><strong>{n.title}</strong><p>{n.message}</p><small>{new Date(n.created_at).toLocaleString()}</small></div><div className="row"><Link className="button secondary" href={n.link||"#"}>Open</Link>{!n.read&&<button onClick={()=>read(n)}>Mark read</button>}</div></article>)}{!items.length&&<p className="muted">No notifications yet.</p>}</section></>;
}
