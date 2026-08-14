"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Application = { id: number; status: string; job: { title: string; company: string } };
type PracticeRecord = { id: string; application: string; track: string; question: string; answer: string; score: number; feedback: string[]; createdAt: string };
type StarStory = { id: string; title: string; situation: string; task: string; action: string; result: string; tags: string };

const tracks: Record<string, string[]> = {
  Strategy: [
    "Walk me through the experience that best prepares you for this role.",
    "Tell me about a time you inherited an unclear or underperforming operation. What did you change?",
    "How do you balance growth, customer experience, risk, and operational control?",
    "Describe a high-stakes decision you made with incomplete information.",
    "How do you communicate difficult news to senior stakeholders, regulators, or clients?",
  ],
  Behavioral: [
    "Tell me about a time you faced significant resistance to a change you were leading.",
    "Describe a conflict with a key stakeholder and how you resolved it.",
    "Tell me about a mistake you made and what you changed afterward.",
    "Give an example of how you developed a team member or future leader.",
    "Describe a time you had to deliver results under an aggressive deadline.",
  ],
  Leadership: [
    "How do you establish accountability without creating a culture of fear?",
    "Tell me about a team you built or transformed.",
    "Describe how you set priorities when every request is presented as urgent.",
    "How have you improved collaboration across functions or business units?",
    "What metrics do you use to determine whether an operation is healthy?",
  ],
  "Banking & Lending": [
    "Describe your approach to construction loan administration and draw risk management.",
    "How do you maintain strong controls while improving loan-servicing speed?",
    "Tell me about a complex credit, servicing, or portfolio issue you escalated.",
    "How have you prepared a lending operation for audit or regulatory review?",
    "What would you examine first when taking responsibility for a commercial loan operation?",
  ],
  Operations: [
    "Tell me about a process you designed from the ground up.",
    "Describe a measurable cycle-time or quality improvement you delivered.",
    "How do you decide what to automate and what should remain human-reviewed?",
    "Tell me about a vendor or technology implementation that did not go as planned.",
    "How do you create durable procedures while keeping teams adaptable?",
  ],
};

const emptyStory: StarStory = { id: "", title: "", situation: "", task: "", action: "", result: "", tags: "" };

function evaluate(answer: string) {
  const text = answer.trim();
  const lower = text.toLowerCase();
  let score = 20;
  const feedback: string[] = [];
  if (text.length >= 350) score += 20; else feedback.push("Add enough context and detail to make the example credible.");
  if (/situation|context|when i|at my/.test(lower)) score += 12; else feedback.push("Open with a concise situation or business context.");
  if (/responsib|task|goal|needed to|my role/.test(lower)) score += 12; else feedback.push("Clarify your specific responsibility or objective.");
  if (/i led|i created|i built|i implemented|i decided|i partnered|i changed/.test(lower)) score += 18; else feedback.push("Make your personal actions unmistakable; use strong first-person verbs.");
  if (/\d|percent|%|million|billion|days|hours|projects|loans|facilities/.test(lower)) score += 14; else feedback.push("Add a quantified result, scale, speed, quality, risk, or financial outcome.");
  if (/result|outcome|improved|reduced|increased|delivered|saved|completed/.test(lower)) score += 10; else feedback.push("Close with the business result and what changed.");
  if (text.length > 1200) { score -= 8; feedback.push("Tighten the answer so it can be delivered in about two minutes."); }
  return { score: Math.max(0, Math.min(100, score)), feedback: feedback.length ? feedback : ["Strong STAR structure. Practice delivering it conversationally and confidently."] };
}

export default function InterviewCoach() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [track, setTrack] = useState("Strategy");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{ score: number; feedback: string[] } | null>(null);
  const [history, setHistory] = useState<PracticeRecord[]>([]);
  const [stories, setStories] = useState<StarStory[]>([]);
  const [story, setStory] = useState<StarStory>(emptyStory);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/applications").then((data) => {
      const apps = data.applications || [];
      setApplications(apps);
      if (apps[0]) setApplicationId(String(apps[0].id));
    }).catch((e) => setError(e.message));
    try {
      setHistory(JSON.parse(localStorage.getItem("careeros-interview-history") || "[]"));
      setStories(JSON.parse(localStorage.getItem("careeros-star-stories") || "[]"));
    } catch { /* ignore invalid local data */ }
  }, []);

  const questions = tracks[track];
  const question = questions[questionIndex % questions.length];
  const selectedApp = applications.find((item) => String(item.id) === applicationId);
  const average = history.length ? Math.round(history.reduce((sum, item) => sum + item.score, 0) / history.length) : 0;
  const readiness = Math.min(100, Math.round((average * 0.65) + (Math.min(stories.length, 5) / 5 * 20) + (Math.min(history.length, 5) / 5 * 15));

  const suggestedStories = useMemo(() => {
    const words = question.toLowerCase().split(/\W+/).filter((word) => word.length > 4);
    return stories.map((item) => ({ item, score: words.filter((word) => `${item.title} ${item.tags} ${item.action} ${item.result}`.toLowerCase().includes(word)).length }))
      .sort((a, b) => b.score - a.score).slice(0, 3).map(({ item }) => item);
  }, [question, stories]);

  function submitAnswer() {
    if (!answer.trim()) return;
    const evaluation = evaluate(answer);
    setResult(evaluation);
    const record: PracticeRecord = {
      id: crypto.randomUUID(),
      application: selectedApp ? `${selectedApp.job.company} — ${selectedApp.job.title}` : "General practice",
      track,
      question,
      answer,
      score: evaluation.score,
      feedback: evaluation.feedback,
      createdAt: new Date().toISOString(),
    };
    const next = [record, ...history].slice(0, 30);
    setHistory(next);
    localStorage.setItem("careeros-interview-history", JSON.stringify(next));
  }

  function nextQuestion() {
    setQuestionIndex((value) => value + 1);
    setAnswer("");
    setResult(null);
  }

  function saveStory(event: React.FormEvent) {
    event.preventDefault();
    if (!story.title.trim()) return;
    const saved = { ...story, id: story.id || crypto.randomUUID() };
    const next = story.id ? stories.map((item) => item.id === story.id ? saved : item) : [saved, ...stories];
    setStories(next);
    localStorage.setItem("careeros-star-stories", JSON.stringify(next));
    setStory(emptyStory);
    setShowStoryForm(false);
  }

  function removeStory(id: string) {
    const next = stories.filter((item) => item.id !== id);
    setStories(next);
    localStorage.setItem("careeros-star-stories", JSON.stringify(next));
  }

  return <>
    <section className="executive-hero coach-hero">
      <div><p className="eyebrow">INTERVIEW PRACTICE GUIDE</p><h1>Practice answers that move the conversation forward.</h1><p className="muted">Choose an opportunity, practice one question at a time, strengthen your STAR structure, and build a reusable story library.</p></div>
      <div className="executive-actions"><Link className="button secondary" href="/interviews">Interview path</Link><Link className="button" href="/outreach">Follow-up outreach</Link></div>
    </section>

    <section className="coach-kpis">
      <article><span>Readiness</span><strong>{readiness}%</strong><small>practice and story coverage</small></article>
      <article><span>Average score</span><strong>{average || "—"}</strong><small>across saved answers</small></article>
      <article><span>Practice answers</span><strong>{history.length}</strong><small>saved in this browser</small></article>
      <article><span>STAR stories</span><strong>{stories.length}</strong><small>reusable examples</small></article>
    </section>

    {error ? <section className="resume-alert resume-alert-error"><strong>Application data unavailable</strong><span>{error}</span></section> : null}

    <div className="coach-layout">
      <aside className="studio-panel coach-settings">
        <p className="eyebrow">SESSION</p><h2>Practice setup</h2>
        <label>Opportunity</label><select value={applicationId} onChange={(e) => setApplicationId(e.target.value)}><option value="">General practice</option>{applications.map((item) => <option value={item.id} key={item.id}>{item.job.company} — {item.job.title}</option>)}</select>
        <label>Question track</label><select value={track} onChange={(e) => { setTrack(e.target.value); setQuestionIndex(0); setResult(null); }}>{Object.keys(tracks).map((item) => <option key={item}>{item}</option>)}</select>
        <div className="coach-progress"><span>Question {questionIndex % questions.length + 1} of {questions.length}</span><div><i style={{ width: `${((questionIndex % questions.length + 1) / questions.length) * 100}%` }} /></div></div>
        <div className="coach-guidance"><strong>Strong answer pattern</strong><span>Situation: 15–20 seconds</span><span>Task: 10–15 seconds</span><span>Action: 45–60 seconds</span><span>Result: 15–20 seconds</span></div>
      </aside>

      <section className="studio-panel mock-interview-panel">
        <div className="row between"><div><p className="eyebrow">MOCK INTERVIEW</p><h2>{track}</h2></div><span className="badge">{selectedApp ? selectedApp.job.company : "General"}</span></div>
        <blockquote className="coach-question">{question}</blockquote>
        {suggestedStories.length ? <div className="story-suggestions"><strong>Possible stories</strong>{suggestedStories.map((item) => <button type="button" key={item.id} onClick={() => setAnswer(`Situation: ${item.situation}\n\nTask: ${item.task}\n\nAction: ${item.action}\n\nResult: ${item.result}`)}>{item.title}</button>)}</div> : null}
        <label>Your answer</label><textarea rows={14} value={answer} placeholder="Use a specific example. Focus on what you personally did and quantify the outcome." onChange={(e) => setAnswer(e.target.value)} />
        <div className="row wrap"><button type="button" disabled={!answer.trim()} onClick={submitAnswer}>Score answer</button><button type="button" className="secondary" onClick={nextQuestion}>Next question</button></div>
        {result ? <section className="coach-result"><div className="coach-score"><strong>{result.score}</strong><small>answer score</small></div><div><h3>{result.score >= 80 ? "Interview-ready foundation" : result.score >= 60 ? "Good foundation—tighten it" : "Needs more specific evidence"}</h3>{result.feedback.map((item) => <p key={item}>• {item}</p>)}</div></section> : null}
      </section>

      <aside className="studio-panel star-library-panel">
        <div className="row between"><div><p className="eyebrow">STORY LIBRARY</p><h2>STAR examples</h2></div><button type="button" className="secondary compact" onClick={() => setShowStoryForm(!showStoryForm)}>Add story</button></div>
        {showStoryForm ? <form onSubmit={saveStory} className="star-form"><label>Story title</label><input value={story.title} onChange={(e) => setStory({ ...story, title: e.target.value })} placeholder="Built a new operating model" /><label>Situation</label><textarea rows={2} value={story.situation} onChange={(e) => setStory({ ...story, situation: e.target.value })} /><label>Task</label><textarea rows={2} value={story.task} onChange={(e) => setStory({ ...story, task: e.target.value })} /><label>Action</label><textarea rows={3} value={story.action} onChange={(e) => setStory({ ...story, action: e.target.value })} /><label>Result</label><textarea rows={2} value={story.result} onChange={(e) => setStory({ ...story, result: e.target.value })} /><label>Tags</label><input value={story.tags} onChange={(e) => setStory({ ...story, tags: e.target.value })} placeholder="leadership, risk, transformation" /><button>Save story</button></form> : null}
        <div className="star-story-list">{stories.map((item) => <article key={item.id}><strong>{item.title}</strong><small>{item.tags || "Uncategorized"}</small><p>{item.result || item.action}</p><div className="row wrap"><button type="button" className="secondary compact" onClick={() => { setStory(item); setShowStoryForm(true); }}>Edit</button><button type="button" className="danger compact" onClick={() => removeStory(item.id)}>Delete</button></div></article>)}{!stories.length ? <p className="muted">Add five versatile stories covering leadership, conflict, transformation, risk, and measurable results.</p> : null}</div>
      </aside>
    </div>

    <section className="dashboard-panel practice-history-panel">
      <div className="row between"><div><p className="eyebrow">PRACTICE HISTORY</p><h2>Recent answers and progress</h2></div>{history.length ? <button className="secondary" onClick={() => { setHistory([]); localStorage.removeItem("careeros-interview-history"); }}>Clear history</button> : null}</div>
      <div className="practice-history">{history.slice(0, 10).map((item) => <article key={item.id}><div className="history-score">{item.score}</div><div><strong>{item.question}</strong><small>{item.application} • {item.track} • {new Date(item.createdAt).toLocaleDateString()}</small><p>{item.feedback[0]}</p></div></article>)}{!history.length ? <p className="muted">No scored practice answers yet.</p> : null}</div>
    </section>
  </>;
}
