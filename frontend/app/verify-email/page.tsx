"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BrandCompass } from "@/components/BrandCompass";
import { api } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [message, setMessage] = useState("");
  const [error, setError] = useState(token ? "" : "This verification link is missing its security token.");
  const [busy, setBusy] = useState(false);

  async function verifyEmail() {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const result = await api("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify your email");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-brand-panel">
        <Link href="/" className="auth-brand" aria-label="CareerNavIQ home">
          <span className="auth-brand-mark"><BrandCompass /></span>
          <span className="auth-brand-copy"><strong>CareerNavIQ</strong><small>Navigate your next career move.</small></span>
        </Link>
        <div className="auth-message">
          <p className="eyebrow">EMAIL VERIFICATION</p>
          <h1>One more step to secure your account.</h1>
          <p>Verified email addresses make account recovery safer and help protect your private career workspace.</p>
        </div>
        <p className="auth-brand-footer">CareerNavIQ · Secure by design</p>
      </section>
      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand"><span className="auth-brand-mark"><BrandCompass /></span><strong>CareerNavIQ</strong></div>
          <p className="eyebrow">VERIFY EMAIL</p>
          <h1>{error ? "Link unavailable" : message ? "Email verified" : "Confirm your email"}</h1>
          {error ? <p className="auth-error" role="alert">{error}</p> : null}
          {message ? <div className="auth-success" role="status"><strong>{message}</strong></div> : null}
          {!error && !message ? (
            <>
              <p className="auth-card-intro">Confirm that you opened this link to verify your CareerNavIQ email address.</p>
              <button className="auth-submit" type="button" onClick={verifyEmail} disabled={busy}>
                {busy ? "Verifying…" : "Verify email address"}
              </button>
            </>
          ) : null}
          <p className="auth-switch"><Link href="/login">Continue to sign in</Link></p>
        </div>
      </section>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="auth-content" />}><VerifyEmailContent /></Suspense>;
}
