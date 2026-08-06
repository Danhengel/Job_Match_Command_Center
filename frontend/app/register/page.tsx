"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandCompass } from "@/components/BrandCompass";
import { api } from "@/lib/api";
import { startAuthenticatedSession } from "@/lib/sessionStorage";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const result = await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });
      startAuthenticatedSession(result.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <Link href="/" className="auth-brand" aria-label="CareerNavIQ home">
          <span className="auth-brand-mark"><BrandCompass /></span>
          <span className="auth-brand-copy">
            <strong>CareerNavIQ</strong>
            <small>Private career intelligence.</small>
          </span>
        </Link>

        <div className="auth-message">
          <p className="eyebrow">ESTABLISH YOUR PRIVATE OFFICE</p>
          <h1>Build the next chapter with intent.</h1>
          <p>
            Replace reactive searching and fragmented tools with a composed system
            for intelligence, positioning, relationships, and decisive action.
          </p>
          <div className="auth-feature-grid">
            <div><strong>Your executive position</strong><span>Distill the evidence behind your value.</span></div>
            <div><strong>Private intelligence</strong><span>Focus on the opportunities that matter.</span></div>
            <div><strong>Opportunity portfolio</strong><span>See every decision and next move.</span></div>
            <div><strong>Executive briefings</strong><span>Prepare evidence-led stories with precision.</span></div>
          </div>
        </div>

        <p className="auth-brand-footer">CareerNavIQ · Private intelligence for a career built with intent</p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="auth-brand-mark"><BrandCompass /></span>
            <strong>CareerNavIQ</strong>
          </div>
          <p className="eyebrow">PRIVATE ACCESS</p>
          <h1>Establish your office</h1>
          <p className="auth-card-intro">Begin your private CareerNavIQ experience.</p>

          <form onSubmit={submit} className="auth-form">
            <label htmlFor="full-name">Full name</label>
            <input
              id="full-name"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Your full name"
              required
            />
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {error ? <p className="auth-error" role="alert">{error}</p> : null}
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? "Establishing your office…" : "Request CareerNavIQ access"}
            </button>
          </form>

          <p className="auth-switch">Already a member? <Link href="/login">Enter your office</Link></p>
          <p className="auth-security-note"><span className="auth-security-dot" />Your workspace and saved career data remain private to your account.</p>
        </div>
      </section>
    </div>
  );
}
