"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Application = { id:number; status:string; job:{ company:string; title:string; location?:string; description?:string } };
type Recruiter = { id:number; name:string; title:string; company:string; email?:string; status:string };
type MessageType = "cover_letter"|"recruiter_intro"|"application_follow_up"|"interview_thank_you"|"linkedin_connection"|"referral_request"|"salary_negotiation"|"offer_acceptance"|"offer_decline";
type Tone = "executive"|"professional"|"friendly"|"direct";

const labels:Record<MessageType,string> = {
 cover_letter:"Cover letter", recruiter_intro:"Recruiter introduction", application_follow_up:"Application follow-up",
 interview_thank_you:"Interview thank-you", linkedin_connection:"LinkedIn connection", referral_request:"Referral request",
 salary_negotiation:"Salary negotiation", offer_acceptance:"Offer acceptance", offer_decline:"Offer decline"
};

function greeting(name?:string){ return name?.trim() ? `Dear ${name.trim()},` : "Dear Hiring Team,"; }

export default function OutreachStudio(){
 const [applications,setApplications]=useState<Application[]>([]),[recruiters,setRecruiters]=useState<Recruiter[]>([]);
 const [applicationId,setApplicationId]=useState(""),[recruiterId,setRecruiterId]=useState(""),[type,setType]=useState<MessageType>("cover_letter"),[tone,setTone]=useState<Tone>("executive");
 const [senderName,setSenderName]=useState("Dan Hengel"),[customNote,setCustomNote]=useState(""),[subject,setSubject]=useState(""),[message,setMessage]=useState(""),[status,setStatus]=useState("");
 const selectedApplication=useMemo(()=>applications.find(x=>String(x.id)===applicationId),[applications,applicationId]);
 const selectedRecruiter=useMemo(()=>recruiters.find(x=>String(x.id)===recruiterId),[recruiters,recruiterId]);

 useEffect(()=>{ Promise.all([api("/api/applications"),api("/api/recruiting/recruiters")]).then(([a,r])=>{
  const apps=Array.isArray(a)?a:a.applications||[]; setApplications(apps); setRecruiters(Array.isArray(r)?r:[]);
  if(apps[0])setApplicationId(String(apps[0].id)); if(r[0])setRecruiterId(String(r[0].id));
 }).catch(e=>setStatus(e instanceof Error?e.message:"Unable to load outreach context.")); },[]);

 function generate(){
  const company=selectedApplication?.job.company||selectedRecruiter?.company||"the company";
  const role=selectedApplication?.job.title||"the opportunity";
  const recipient=selectedRecruiter?.name;
  const opener=tone==="executive"?"I am reaching out regarding":tone==="friendly"?"I wanted to connect about":tone==="direct"?"I am writing about":"I am writing to express my interest in";
  let s="",b="";
  if(type==="cover_letter"){
   s=`Application for ${role}`;
   b=`${greeting(recipient)}\n\n${opener} the ${role} position with ${company}. My background leading complex lending, construction administration, portfolio operations, risk controls, and process transformation aligns strongly with the role's leadership and execution needs.\n\nAcross my career, I have built operating models, led high-volume construction and commercial loan workflows, strengthened governance, and translated complex requirements into scalable processes. I would welcome the opportunity to discuss how that experience can support ${company}'s priorities.\n\n${customNote?customNote+"\n\n":""}Sincerely,\n${senderName}`;
  } else if(type==="recruiter_intro"){
   s=`Interest in ${role}`; b=`${greeting(recipient)}\n\n${opener} the ${role} opportunity at ${company}. My experience includes executive leadership across construction lending, commercial loan operations, portfolio governance, risk management, and process improvement.\n\nI would appreciate the opportunity to learn more about the role and discuss where my background may fit.\n\n${customNote?customNote+"\n\n":""}Best,\n${senderName}`;
  } else if(type==="application_follow_up"){
   s=`Follow-up: ${role}`; b=`${greeting(recipient)}\n\nI am following up on my application for the ${role} position at ${company}. I remain very interested and believe my experience in lending operations, construction administration, portfolio oversight, and team leadership aligns well with the role.\n\nPlease let me know if any additional information would be helpful.\n\nBest,\n${senderName}`;
  } else if(type==="interview_thank_you"){
   s=`Thank you — ${role}`; b=`${greeting(recipient)}\n\nThank you for taking the time to speak with me about the ${role} opportunity at ${company}. I appreciated learning more about the team, the role's priorities, and the challenges ahead.\n\nOur conversation reinforced my interest, particularly the opportunity to apply my experience building scalable operations, strengthening controls, and leading complex lending and construction workflows.\n\nBest regards,\n${senderName}`;
  } else if(type==="linkedin_connection"){
   s="LinkedIn connection request"; b=`Hi ${recipient||"there"}, I am interested in the ${role} opportunity at ${company}. My background is in construction lending, commercial operations, and portfolio leadership. I would value connecting with you.`;
  } else if(type==="referral_request"){
   s=`Referral request — ${role}`; b=`Hi ${recipient||"there"},\n\nI am exploring the ${role} opportunity at ${company}. Based on my background in construction lending, commercial loan operations, risk, and executive leadership, I believe the role could be a strong fit. Would you be comfortable sharing any insight or referring me to the appropriate person?\n\nThank you,\n${senderName}`;
  } else if(type==="salary_negotiation"){
   s=`Compensation discussion — ${role}`; b=`${greeting(recipient)}\n\nThank you again for the offer for the ${role} position. I am enthusiastic about the opportunity and confident I can contribute quickly. Based on the scope of the role, market expectations, and the depth of experience I bring in lending operations, construction administration, risk, and transformation, I would like to discuss whether there is flexibility in the compensation package.\n\nI remain very interested in joining ${company} and hope we can reach terms that reflect the value and responsibility of the position.\n\nBest regards,\n${senderName}`;
  } else if(type==="offer_acceptance"){
   s=`Acceptance — ${role}`; b=`${greeting(recipient)}\n\nI am pleased to accept the offer for the ${role} position with ${company}. Thank you for the opportunity and for the confidence you have placed in me.\n\nI am excited to join the team and contribute. Please let me know the next steps and any documents you need from me.\n\nSincerely,\n${senderName}`;
  } else {
   s=`Regarding the ${role} offer`; b=`${greeting(recipient)}\n\nThank you very much for offering me the ${role} position with ${company}. After careful consideration, I have decided to decline the offer. I sincerely appreciate the time invested by you and the team and hope our paths cross again.\n\nBest regards,\n${senderName}`;
  }
  setSubject(s); setMessage(b); setStatus("Draft generated. Review every detail before sending.");
 }
 async function copy(value:string,label:string){ await navigator.clipboard.writeText(value); setStatus(`${label} copied.`); }
 const wordCount=message.trim()?message.trim().split(/\s+/).length:0;
 return <>
  <section className="executive-hero outreach-hero"><div><p className="eyebrow">SPRINT 6 · OUTREACH STUDIO</p><h1>Write the right message for every career moment.</h1><p className="muted">Generate editable, evidence-aware drafts for applications, recruiters, interviews, LinkedIn, and offers.</p></div><div className="outreach-score"><strong>{wordCount}</strong><span>words</span></div></section>
  {status&&<div className="outreach-notice">{status}</div>}
  <div className="outreach-layout">
   <aside className="outreach-controls">
    <h2>Message context</h2>
    <label>Application</label><select value={applicationId} onChange={e=>setApplicationId(e.target.value)}><option value="">No application selected</option>{applications.map(a=><option key={a.id} value={a.id}>{a.job.company} — {a.job.title}</option>)}</select>
    <label>Recruiter or hiring contact</label><select value={recruiterId} onChange={e=>setRecruiterId(e.target.value)}><option value="">Hiring team</option>{recruiters.map(r=><option key={r.id} value={r.id}>{r.name} — {r.company}</option>)}</select>
    <label>Message type</label><select value={type} onChange={e=>setType(e.target.value as MessageType)}>{Object.entries(labels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select>
    <label>Tone</label><select value={tone} onChange={e=>setTone(e.target.value as Tone)}><option value="executive">Executive</option><option value="professional">Professional</option><option value="friendly">Friendly</option><option value="direct">Direct</option></select>
    <label>Your name</label><input value={senderName} onChange={e=>setSenderName(e.target.value)}/>
    <label>Optional point to include</label><textarea rows={4} value={customNote} onChange={e=>setCustomNote(e.target.value)} placeholder="Add a detail from the conversation or role."/>
    <button onClick={generate}>Generate draft</button>
   </aside>
   <section className="outreach-editor">
    <div className="row between"><div><p className="eyebrow">EDITABLE DRAFT</p><h2>{labels[type]}</h2></div><span className="badge">{tone}</span></div>
    <label>Subject</label><input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Generate or enter a subject line"/>
    <label>Message</label><textarea className="outreach-message" value={message} onChange={e=>setMessage(e.target.value)} placeholder="Choose the context, then generate a draft."/>
    <div className="row wrap"><button disabled={!subject} onClick={()=>copy(subject,"Subject")}>Copy subject</button><button className="secondary" disabled={!message} onClick={()=>copy(message,"Message")}>Copy message</button><button className="secondary" disabled={!subject&&!message} onClick={()=>copy(`${subject}\n\n${message}`,"Full draft")}>Copy all</button></div>
   </section>
   <aside className="outreach-guidance"><p className="eyebrow">QUALITY CHECK</p><h2>Before sending</h2><ul><li>Confirm company, role, and recipient names.</li><li>Add one specific detail from the posting or conversation.</li><li>Keep every claim supported by your actual experience.</li><li>Use LinkedIn drafts as concise connection notes.</li><li>Review tone and remove generic language.</li></ul><div className="outreach-context"><span>Selected company</span><strong>{selectedApplication?.job.company||selectedRecruiter?.company||"Not selected"}</strong><span>Selected role</span><strong>{selectedApplication?.job.title||"Not selected"}</strong><span>Recipient</span><strong>{selectedRecruiter?.name||"Hiring team"}</strong></div></aside>
  </div>
 </>;
}
