"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Activity = { label: string; detail?: string; created_at?: string };
type DashboardData = {
  user_name?: string; average_completeness?: number; resume_count?: number; analyzed_resumes?: number;
  high_match_count?: number; application_count?: number; interview_count?: number; offer_count?: number;
  tailored_resume_count?: number; followups_due?: number; status_counts?: Record<string, number>; recent_activity?: Activity[];
};
type DigestData = { unread_count?: number; high_matches?: number; saved_search_updates?: number; follow_ups_due?: number };
type Interview = { id:number; application_id:number; title:string; event_type:string; starts_at:string; completed:boolean };
type Recruiter = { id:number; name:string; company:string; next_follow_up_at:string|null; last_contact_at:string|null; relationship_score:number };
type SearchRun = { id:number; unique_count:number; matched_count:number; created_at:string };
type Application = { id:number; status:string; created_at?:string; updated_at?:string; job:{ title:string; company:string } };
type Goals = { applications:number; recruiterFollowups:number; mockInterviews:number; networking:number };

const defaultGoals: Goals = { applications: 20, recruiterFollowups: 5, mockInterviews: 3, networking: 10 };
const stageOrder = ["wishlist", "applied", "recruiter", "interview", "final", "offer", "accepted"];
const stageLabels: Record<string,string> = { wishlist:"Saved", applied:"Applied", recruiter:"Recruiter", interview:"Interview", final:"Final", offer:"Offer", accepted:"Accepted" };

function startOfWeek() {
  const date = new Date();
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  date.setHours(0,0,0,0);
  return date;
}
function safeDate(value?: string | null) { return value ? new Date(value) : null; }
function percent(value:number, target:number) { return Math.min(100, Math.round((value / Math.max(1,target)) * 100)); }
function daysUntil(value:string) { return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000); }

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [searches, setSearches] = useState<SearchRun[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [goals, setGoals] = useState<Goals>(defaultGoals);
  const [practiceCount, setPracticeCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("careeros-command-goals");
      if (saved) setGoals({ ...defaultGoals, ...JSON.parse(saved) });
      const practice = JSON.parse(localStorage.getItem("careeros-interview-history") || "[]");
      setPracticeCount(Array.isArray(practice) ? practice.filter((item:any) => safeDate(item.created_at)?.getTime()! >= startOfWeek().getTime()).length : 0);
    } catch { /* keep defaults */ }

    let active = true;
    (async () => {
      try {
        const [dashboard, interviewData, recruiterData, searchData, appData] = await Promise.all([
          api("/api/dashboard"),
          api("/api/recruiting/interviews").catch(() => []),
          api("/api/recruiting/recruiters").catch(() => []),
          api("/api/jobs/history").catch(() => []),
          api("/api/applications").catch(() => ({ applications: [] })),
        ]);
        if (!active) return;
        setData(dashboard); setInterviews(interviewData || []); setRecruiters(recruiterData || []);
        setSearches(searchData || []); setApplications(appData.applications || []);
        try { setDigest(await api("/api/automation/digest")); } catch { setDigest(null); }
      } catch (err) { if (active) setError(err instanceof Error ? err.message : "Unable to load dashboard."); }
    })();
    return () => { active = false; };
  }, []);

  const computed = useMemo(() => {
    const week = startOfWeek().getTime();
    const now = Date.now();
    const upcoming = interviews.filter(item => !item.completed && new Date(item.starts_at).getTime() >= now).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
    const dueRecruiters = recruiters.filter(item => item.next_follow_up_at && new Date(item.next_follow_up_at).getTime() <= now);
    const applicationsThisWeek = applications.filter(item => safeDate(item.created_at || item.updated_at)?.getTime()! >= week).length;
    const recruiterTouches = recruiters.filter(item => safeDate(item.last_contact_at)?.getTime()! >= week).length;
    const latestSearch = searches[0];
    const stages = data?.status_counts || {};
    const applicationsCount = data?.application_count || applications.length;
    const interviewCount = data?.interview_count || 0;
    const offers = data?.offer_count || 0;
    const responseRate = applicationsCount ? Math.round(((stages.recruiter || 0)+(stages.interview || 0)+(stages.final || 0)+(stages.offer || 0)+(stages.accepted || 0))/applicationsCount*100) : 0;
    const interviewRate = applicationsCount ? Math.round((interviewCount/applicationsCount)*100) : 0;
    const healthParts = [
      Math.min(100, data?.average_completeness || 0),
      applicationsThisWeek ? Math.min(100, applicationsThisWeek/goals.applications*100) : 0,
      recruiters.length ? Math.min(100, Math.max(20, recruiterTouches/goals.recruiterFollowups*100)) : 0,
      upcoming.length ? 100 : 45,
      Math.min(100, practiceCount/goals.mockInterviews*100),
      (data?.followups_due || dueRecruiters.length) === 0 ? 100 : 55,
    ];
    const health = Math.round(healthParts.reduce((a,b)=>a+b,0)/healthParts.length);
    return { upcoming, nextInterview: upcoming[0] || null, dueRecruiters, applicationsThisWeek, recruiterTouches, latestSearch, stages, applicationsCount, interviewCount, offers, responseRate, interviewRate, health };
  }, [data, interviews, recruiters, searches, applications, goals, practiceCount]);

  function updateGoal(key:keyof Goals, value:number) {
    const next = { ...goals, [key]: Math.max(1,value) };
    setGoals(next); localStorage.setItem("careeros-command-goals", JSON.stringify(next));
  }

  if (error) return <section className="dashboard-panel"><h2>Navigation hub unavailable</h2><p className="error">{error}</p><Link className="button" href="/login">Sign in again</Link></section>;
  if (!data) return <section className="dashboard-panel"><p className="eyebrow">CAREERNAVIQ NAVIGATION HUB</p><h2>Charting your current route…</h2></section>;

  const firstName = data.user_name?.trim().split(/\s+/)[0] || "there";
  const highMatches = data.high_match_count ?? digest?.high_matches ?? 0;
  const followups = (data.followups_due || 0) + computed.dueRecruiters.length;
  const maxStage = Math.max(1, ...Object.values(computed.stages));
  const priorities = [
    ...(followups ? [{title:`Complete ${followups} follow-up${followups===1?"":"s"}`, detail:"Keep active applications and recruiter relationships moving.", href:"/crm", action:"Review follow-ups", urgency:"Due now"}] : []),
    ...(computed.nextInterview ? [{title:`Prepare for ${computed.nextInterview.title}`, detail:`${daysUntil(computed.nextInterview.starts_at)} day${daysUntil(computed.nextInterview.starts_at)===1?"":"s"} away. Review stories, questions, and role evidence.`, href:"/interview-coach", action:"Practice now", urgency:"Upcoming"}] : []),
    ...(highMatches ? [{title:`Review ${highMatches} high-alignment opportunit${highMatches===1?"y":"ies"}`, detail:"Compare newly identified routes and prepare the evidence for your strongest options.", href:"/jobs", action:"Explore routes", urgency:"Opportunity"}] : []),
  ];
  if (!priorities.length) priorities.push({title:"Explore your next route", detail:"Scan the opportunity landscape for roles aligned with your direction.", href:"/jobs", action:"Open opportunity map", urgency:"Next move"});

  return <>
    <section className="command-hero">
      <div><p className="eyebrow">YOUR CAREER NAVIGATION HUB</p><h1>Good {new Date().getHours()<12?"morning":new Date().getHours()<18?"afternoon":"evening"}, {firstName}.</h1><p>Your navigation score is <strong>{computed.health}%</strong>. You have {priorities.length} priority waypoint{priorities.length===1?"":"s"} to move forward today.</p><div className="row wrap"><Link className="button" href={priorities[0].href}>{priorities[0].action}</Link><Link className="button secondary" href="/jobs">Explore opportunity map</Link></div></div>
      <div className="health-ring" style={{"--health":`${computed.health*3.6}deg`} as React.CSSProperties}><div><strong>{computed.health}</strong><span>Navigation score</span></div></div>
    </section>

    <section className="command-kpis">
      <article><span>Applications underway</span><strong>{computed.applicationsCount}</strong><small>{computed.applicationsThisWeek} started this week</small></article>
      <article><span>Response signals</span><strong>{computed.responseRate}%</strong><small>Recruiter response or beyond</small></article>
      <article><span>Interview waypoints</span><strong>{computed.interviewRate}%</strong><small>{computed.interviewCount} active interviews</small></article>
      <article><span>Strong route options</span><strong>{highMatches}</strong><small>{computed.latestSearch?.matched_count || 0} in latest search</small></article>
      <article><span>Offers</span><strong>{computed.offers}</strong><small>Offer and accepted stages</small></article>
      <article><span>Résumé readiness</span><strong>{data.average_completeness || 0}%</strong><small>{data.analyzed_resumes || 0} résumés reviewed</small></article>
    </section>

    <section className="command-grid command-grid-primary">
      <article className="command-panel"><div className="row between"><div><p className="eyebrow">TODAY’S ROUTE</p><h2>Your next waypoints</h2></div><span className="command-count">{priorities.length}</span></div><div className="priority-list">{priorities.slice(0,4).map((item,index)=><div className="priority-item" key={item.title}><span className="priority-number">{index+1}</span><div><small>{item.urgency}</small><h3>{item.title}</h3><p>{item.detail}</p></div><Link className="button secondary compact" href={item.href}>{item.action}</Link></div>)}</div></article>
      <article className="command-panel"><p className="eyebrow">NEXT INTERVIEW WAYPOINT</p>{computed.nextInterview?<><h2>{computed.nextInterview.title}</h2><p className="command-date">{new Date(computed.nextInterview.starts_at).toLocaleString()}</p><div className="countdown"><strong>{Math.max(0,daysUntil(computed.nextInterview.starts_at))}</strong><span>days to prepare</span></div><div className="row wrap"><Link className="button" href="/interview-coach">Open practice guide</Link><Link className="button secondary" href="/interviews">View interview path</Link></div></>:<><h2>No interview scheduled</h2><p className="muted">When an application advances, its interview and preparation steps will appear here.</p><Link className="button secondary" href="/interviews">Open interview path</Link></>}</article>
    </section>

    <section className="command-grid">
      <article className="command-panel"><div className="row between"><div><p className="eyebrow">ROUTE PROGRESS</p><h2>Movement by stage</h2></div><Link href="/applications">Open tracker →</Link></div><div className="command-funnel">{stageOrder.map((stage,index)=>{const count=computed.stages[stage]||0;const previous=index?computed.stages[stageOrder[index-1]]||0:computed.applicationsCount;const conversion=previous?Math.round(count/previous*100):0;return <div className="funnel-row" key={stage}><div><span>{stageLabels[stage]}</span><small>{index?`${conversion}% from prior stage`:"Total tracked"}</small></div><div className="funnel-track"><div style={{width:`${Math.max(count?8:0,(count/maxStage)*100)}%`}} /></div><strong>{count}</strong></div>})}</div></article>
      <article className="command-panel"><div className="row between"><div><p className="eyebrow">WEEKLY GOALS</p><h2>Consistency tracker</h2></div><small className="muted">Saved on this device</small></div>{[
        ["applications","Applications",computed.applicationsThisWeek],
        ["recruiterFollowups","Recruiter touches",computed.recruiterTouches],
        ["mockInterviews","Mock interviews",practiceCount],
        ["networking","Networking messages",computed.recruiterTouches],
      ].map(([key,label,value])=><div className="goal-row" key={String(key)}><div className="row between"><span>{label}</span><label>{value} / <input type="number" min="1" value={goals[key as keyof Goals]} onChange={e=>updateGoal(key as keyof Goals,Number(e.target.value))}/></label></div><div className="goal-track"><div style={{width:`${percent(Number(value),goals[key as keyof Goals])}%`}} /></div></div>)}</article>
    </section>

    <section className="command-grid">
      <article className="command-panel"><p className="eyebrow">NAVIGATION GUIDANCE</p><h2>Evidence-led next moves</h2><div className="insight-list"><div><strong>{followups?"Follow-ups mark your next waypoint":"Your follow-ups are on track"}</strong><span>{followups?`${followups} action${followups===1?"":"s"} are due across applications and relationships.`:"No overdue application or relationship actions were detected."}</span></div><div><strong>{computed.responseRate>=20?"Your route is generating responses":"Adjust your approach"}</strong><span>{computed.responseRate}% of tracked applications have reached recruiter response or later.</span></div><div><strong>{practiceCount>=goals.mockInterviews?"Interview practice goal reached":"Add an interview practice session"}</strong><span>{practiceCount} practice session{practiceCount===1?"":"s"} recorded this week against a goal of {goals.mockInterviews}.</span></div><div><strong>{computed.latestSearch?"Your latest search revealed new routes":"Explore the opportunity landscape"}</strong><span>{computed.latestSearch?`${computed.latestSearch.matched_count} strong signals from ${computed.latestSearch.unique_count} opportunities.`:"No recent opportunity search was found."}</span></div></div></article>
      <article className="command-panel"><p className="eyebrow">ROUTE TOOLS</p><h2>Choose your next move</h2><div className="command-actions"><Link href="/jobs"><strong>Explore opportunity map</strong><span>Find and compare possible routes</span></Link><Link href="/resumes/studio"><strong>Build your résumé route</strong><span>Prepare evidence for the next move</span></Link><Link href="/outreach"><strong>Plan outreach</strong><span>Draft clear messages and follow-ups</span></Link><Link href="/interview-coach"><strong>Open practice guide</strong><span>Strengthen stories and key answers</span></Link><Link href="/crm"><strong>Review your network map</strong><span>Keep important relationships moving</span></Link><Link href="/analytics"><strong>Read progress signals</strong><span>Use patterns to adjust your route</span></Link></div></article>
    </section>

    <section className="command-panel"><div className="row between"><div><p className="eyebrow">RECENT WAYPOINTS</p><h2>Your latest movement</h2></div><Link href="/command-center">Open route overview →</Link></div><div className="activity-list">{data.recent_activity?.length?data.recent_activity.slice(0,6).map((item,index)=><div className="activity-item" key={`${item.label}-${index}`}><strong>{item.label}</strong><small>{item.detail||"Career route updated"}</small></div>):<p className="muted">Your latest résumé, application, and interview movement will appear here.</p>}</div></section>
  </>;
}
