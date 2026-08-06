"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Application = {
  id: number;
  status: string;
  job: {
    company: string;
    title: string;
    location?: string;
    description?: string;
  };
};

type Recruiter = {
  id: number;
  name: string;
  title: string;
  company: string;
  email?: string;
  status: string;
};

type User = {
  full_name?: string;
};

type MessageType =
  | "cover_letter"
  | "recruiter_intro"
  | "application_follow_up"
  | "interview_thank_you"
  | "linkedin_connection"
  | "referral_request"
  | "salary_negotiation"
  | "offer_acceptance"
  | "offer_decline";

type Tone = "executive" | "professional" | "friendly" | "direct";

const labels: Record<MessageType, string> = {
  cover_letter: "Cover letter",
  recruiter_intro: "Recruiter introduction",
  application_follow_up: "Application follow-up",
  interview_thank_you: "Interview thank-you",
  linkedin_connection: "LinkedIn connection",
  referral_request: "Referral request",
  salary_negotiation: "Salary negotiation",
  offer_acceptance: "Offer acceptance",
  offer_decline: "Offer decline",
};

function greeting(name?: string) {
  return name?.trim() ? `Dear ${name.trim()},` : "Dear Hiring Team,";
}

function noteParagraph(customNote: string) {
  const note = customNote.trim();
  return note ? `${note}\n\n` : "";
}

export default function OutreachStudio() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [applicationId, setApplicationId] = useState("");
  const [recruiterId, setRecruiterId] = useState("");
  const [type, setType] = useState<MessageType>("cover_letter");
  const [tone, setTone] = useState<Tone>("professional");
  const [senderName, setSenderName] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const selectedApplication = useMemo(
    () => applications.find((item) => String(item.id) === applicationId),
    [applications, applicationId],
  );

  const selectedRecruiter = useMemo(
    () => recruiters.find((item) => String(item.id) === recruiterId),
    [recruiters, recruiterId],
  );

  useEffect(() => {
    Promise.all([
      api("/api/applications"),
      api("/api/recruiting/recruiters"),
      api("/api/auth/me").catch(() => ({})),
    ])
      .then(([applicationData, recruiterData, userData]) => {
        const apps = Array.isArray(applicationData)
          ? applicationData
          : applicationData.applications || [];
        const contacts = Array.isArray(recruiterData) ? recruiterData : [];
        const user = userData as User;

        setApplications(apps);
        setRecruiters(contacts);
        setSenderName(user.full_name?.trim() || "");
        if (apps[0]) setApplicationId(String(apps[0].id));
        if (contacts[0]) setRecruiterId(String(contacts[0].id));
      })
      .catch((error) =>
        setStatus(
          error instanceof Error
            ? error.message
            : "Unable to load outreach context.",
        ),
      );
  }, []);

  function generate() {
    const company =
      selectedApplication?.job.company
      || selectedRecruiter?.company
      || "the company";
    const role = selectedApplication?.job.title || "the opportunity";
    const recipient = selectedRecruiter?.name;
    const signature = senderName.trim() || "Your name";
    const includedNote = noteParagraph(customNote);
    const opener =
      tone === "friendly"
        ? "I wanted to connect about"
        : tone === "direct"
          ? "I am writing about"
          : tone === "executive"
            ? "I am reaching out regarding"
            : "I am writing to express my interest in";

    let nextSubject = "";
    let nextMessage = "";

    if (type === "cover_letter") {
      nextSubject = `Application for ${role}`;
      nextMessage = `${greeting(recipient)}\n\n${opener} the ${role} position with ${company}. The opportunity aligns with the direction of my search, and I am interested in learning more about the team’s priorities and the results expected from this role.\n\n${includedNote}I would welcome the opportunity to discuss the experience and examples most relevant to ${company}.\n\nSincerely,\n${signature}`;
    } else if (type === "recruiter_intro") {
      nextSubject = `Interest in ${role}`;
      nextMessage = `${greeting(recipient)}\n\n${opener} the ${role} opportunity at ${company}. I am interested in the role and would appreciate the chance to learn more about the team, scope, and qualifications that matter most.\n\n${includedNote}Please let me know whether a brief conversation would be useful.\n\nBest,\n${signature}`;
    } else if (type === "application_follow_up") {
      nextSubject = `Follow-up: ${role}`;
      nextMessage = `${greeting(recipient)}\n\nI am following up on my application for the ${role} position at ${company}. I remain interested in the opportunity and would be glad to provide any additional information that would help with your review.\n\n${includedNote}Thank you for your time and consideration.\n\nBest,\n${signature}`;
    } else if (type === "interview_thank_you") {
      nextSubject = `Thank you — ${role}`;
      nextMessage = `${greeting(recipient)}\n\nThank you for taking the time to speak with me about the ${role} opportunity at ${company}. I appreciated learning more about the team, the role’s priorities, and what success would look like.\n\n${includedNote}Our conversation reinforced my interest. Please let me know if I can provide anything else as you continue the process.\n\nBest regards,\n${signature}`;
    } else if (type === "linkedin_connection") {
      nextSubject = "LinkedIn connection request";
      nextMessage = `Hi ${recipient || "there"}, I am interested in the ${role} opportunity at ${company} and would value connecting with you. ${customNote.trim()}`.trim();
    } else if (type === "referral_request") {
      nextSubject = `Referral request — ${role}`;
      nextMessage = `Hi ${recipient || "there"},\n\nI am exploring the ${role} opportunity at ${company}. ${includedNote}Would you be comfortable sharing any insight about the role or directing me to the appropriate person? I completely understand if you are not able to make a referral.\n\nThank you,\n${signature}`;
    } else if (type === "salary_negotiation") {
      nextSubject = `Compensation discussion — ${role}`;
      nextMessage = `${greeting(recipient)}\n\nThank you again for the offer for the ${role} position. I am enthusiastic about the opportunity and would like to discuss whether there is flexibility in the compensation package based on the role’s scope, market considerations, and the value expected from the position.\n\n${includedNote}I remain very interested in joining ${company} and hope we can reach terms that work for both sides.\n\nBest regards,\n${signature}`;
    } else if (type === "offer_acceptance") {
      nextSubject = `Acceptance — ${role}`;
      nextMessage = `${greeting(recipient)}\n\nI am pleased to accept the offer for the ${role} position with ${company}. Thank you for the opportunity and for the confidence you have placed in me.\n\nI am excited to join the team. Please let me know the next steps and any documents you need from me.\n\nSincerely,\n${signature}`;
    } else {
      nextSubject = `Regarding the ${role} offer`;
      nextMessage = `${greeting(recipient)}\n\nThank you very much for offering me the ${role} position with ${company}. After careful consideration, I have decided to decline the offer. I sincerely appreciate the time invested by you and the team and hope our paths cross again.\n\nBest regards,\n${signature}`;
    }

    setSubject(nextSubject);
    setMessage(nextMessage);
    setStatus(
      "Draft generated without assumed experience claims. Add specific, accurate evidence before sending.",
    );
  }

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setStatus(`${label} copied.`);
  }

  const wordCount = message.trim()
    ? message.trim().split(/\s+/).length
    : 0;

  return (
    <>
      <section className="executive-hero outreach-hero">
        <div>
          <p className="eyebrow">OUTREACH STUDIO</p>
          <h1>Write the right message for every career moment.</h1>
          <p className="muted">
            Generate editable drafts for applications, recruiters, interviews,
            LinkedIn, and offers without inventing experience.
          </p>
        </div>
        <div className="outreach-score">
          <strong>{wordCount}</strong>
          <span>words</span>
        </div>
      </section>

      {status ? <div className="outreach-notice">{status}</div> : null}

      <div className="outreach-layout">
        <aside className="outreach-controls">
          <h2>Message context</h2>
          <label>Application</label>
          <select
            value={applicationId}
            onChange={(event) => setApplicationId(event.target.value)}
          >
            <option value="">No application selected</option>
            {applications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.job.company} — {application.job.title}
              </option>
            ))}
          </select>

          <label>Recruiter or hiring contact</label>
          <select
            value={recruiterId}
            onChange={(event) => setRecruiterId(event.target.value)}
          >
            <option value="">Hiring team</option>
            {recruiters.map((recruiter) => (
              <option key={recruiter.id} value={recruiter.id}>
                {recruiter.name} — {recruiter.company}
              </option>
            ))}
          </select>

          <label>Message type</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as MessageType)}
          >
            {Object.entries(labels).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>

          <label>Tone</label>
          <select
            value={tone}
            onChange={(event) => setTone(event.target.value as Tone)}
          >
            <option value="executive">Executive</option>
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="direct">Direct</option>
          </select>

          <label>Your name</label>
          <input
            value={senderName}
            onChange={(event) => setSenderName(event.target.value)}
            placeholder="Your name"
          />

          <label>Accurate point to include</label>
          <textarea
            rows={4}
            value={customNote}
            onChange={(event) => setCustomNote(event.target.value)}
            placeholder="Add a specific qualification, result, or detail from the conversation."
          />
          <button onClick={generate}>Generate draft</button>
        </aside>

        <section className="outreach-editor">
          <div className="row between">
            <div>
              <p className="eyebrow">EDITABLE DRAFT</p>
              <h2>{labels[type]}</h2>
            </div>
            <span className="badge">{tone}</span>
          </div>
          <label>Subject</label>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Generate or enter a subject line"
          />
          <label>Message</label>
          <textarea
            className="outreach-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Choose the context, then generate a draft."
          />
          <div className="row wrap">
            <button disabled={!subject} onClick={() => copy(subject, "Subject")}>Copy subject</button>
            <button className="secondary" disabled={!message} onClick={() => copy(message, "Message")}>Copy message</button>
            <button
              className="secondary"
              disabled={!subject && !message}
              onClick={() => copy(`${subject}\n\n${message}`, "Full draft")}
            >
              Copy all
            </button>
          </div>
        </section>

        <aside className="outreach-guidance">
          <p className="eyebrow">QUALITY CHECK</p>
          <h2>Before sending</h2>
          <ul>
            <li>Confirm company, role, recipient, and your own name.</li>
            <li>Add one specific detail from the posting or conversation.</li>
            <li>Keep every claim supported by your actual experience.</li>
            <li>Use LinkedIn drafts as concise connection notes.</li>
            <li>Review tone and remove generic language.</li>
          </ul>
          <div className="outreach-context">
            <span>Selected company</span>
            <strong>{selectedApplication?.job.company || selectedRecruiter?.company || "Not selected"}</strong>
            <span>Selected role</span>
            <strong>{selectedApplication?.job.title || "Not selected"}</strong>
            <span>Recipient</span>
            <strong>{selectedRecruiter?.name || "Hiring team"}</strong>
          </div>
        </aside>
      </div>
    </>
  );
}
