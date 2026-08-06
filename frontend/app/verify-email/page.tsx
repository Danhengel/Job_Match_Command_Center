"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BrandCompass } from "@/components/BrandCompass";
import { api } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [message, setMessage] = useState("Verifying your email address…");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("This verification link is missing its security token.");
      return;
    }
    api("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then((result) => setMessage(result.message))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to verify your email"));
  }, [token]);

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
          <h1>{error ? "Link unavailable" : "Email verification"}</h1>
          {error ? <p className="auth-error" role="alert">{error}</p> : <div className="auth-success" role="status"><strong>{message}</strong></div>}
          <p className="auth-switch"><Link href="/login">Continue to sign in</Link></p>
        </div>
      </section>
    </div>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="auth-content" />}><VerifyEmailContent /></Suspense>;
}
