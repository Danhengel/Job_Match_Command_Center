"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
    <div className="auth-page executive-auth-page auth-page-centered">
      <section className="auth-form-panel auth-form-panel-centered">
        <div className="auth-centered-shell">
          <Link href="/" className="auth-centered-logo" aria-label="CareerNavIQ home">
            <img
              src="/careernaviq-logo.svg?v=20260813-register"
              width="1600"
              height="300"
              alt="CareerNavIQ"
            />
          </Link>

          <div className="auth-card auth-card-large">
            <p className="eyebrow">PRIVATE ACCESS</p>
            <h1>Create your account</h1>
            <p className="auth-card-intro">Establish your private executive career workspace.</p>

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
              <small className="auth-field-note">Use at least 8 characters.</small>

              {error ? <p className="auth-error" role="alert">{error}</p> : null}

              <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? "Creating workspace…" : "Create CareerNavIQ account"}
              </button>
            </form>

            <div className="auth-divider" />
            <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
            <p className="auth-security-note"><span className="auth-security-dot" />Your saved career information remains private to your account.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
