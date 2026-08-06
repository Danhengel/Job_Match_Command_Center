"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BrandCompass } from "@/components/BrandCompass";
import { api } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("This reset link is missing its security token.");
      return;
    }
    setBusy(true);
    try {
      const result = await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password, confirm_password: confirmPassword }),
      });
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset your password");
    } finally {
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
            <small>Navigate your next career move.</small>
          </span>
        </Link>
        <div className="auth-message">
          <p className="eyebrow">PROTECT YOUR ACCOUNT</p>
          <h1>Create a strong new password.</h1>
          <p>Using a unique password helps keep your résumés, applications, and career information private.</p>
        </div>
        <p className="auth-brand-footer">CareerNavIQ · Secure by design</p>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="auth-brand-mark"><BrandCompass /></span>
            <strong>CareerNavIQ</strong>
          </div>
          <p className="eyebrow">CREATE A NEW PASSWORD</p>
          <h1>Choose your password</h1>
          <p className="auth-card-intro">This link can be used once and expires automatically.</p>

          {message ? (
            <div className="auth-success" role="status">
              <strong>Password updated</strong>
              <span>{message}</span>
              <Link href="/login" className="auth-success-action">Sign in to CareerNavIQ</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="auth-form">
              <label htmlFor="password">New password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
              <div className="password-requirements" aria-label="Password requirements">
                <span className={requirements.length ? "met" : ""}>At least 8 characters</span>
                <span className={requirements.uppercase ? "met" : ""}>Uppercase letter</span>
                <span className={requirements.lowercase ? "met" : ""}>Lowercase letter</span>
                <span className={requirements.number ? "met" : ""}>Number</span>
              </div>
              {error ? <p className="auth-error" role="alert">{error}</p> : null}
              <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
          {!message ? <p className="auth-switch"><Link href="/login">Return to sign in</Link></p> : null}
        </div>
      </section>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-content" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
