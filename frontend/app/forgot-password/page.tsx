"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function beginRecovery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const result = await api("/api/auth/recovery/start", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), recovery_key: recoveryKey }),
      });
      setResetToken(result.reset_token);
      setMessage("Identity verified. Choose a new password below.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start recovery");
    } finally {
      setBusy(false);
    }
  }

  async function finishRecovery(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const result = await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ reset_token: resetToken, new_password: password }),
      });
      setMessage(result.message || "Password updated. You can now sign in.");
      setResetToken("");
      setRecoveryKey("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page executive-auth-page">
      <section className="auth-brand-panel">
        <div className="auth-message">
          <p className="eyebrow">ACCOUNT RECOVERY</p>
          <h1>Restore secure access.</h1>
          <p className="auth-lead">
            Reset the password on your existing CareerNavIQ account without creating a new profile or changing your saved career data.
          </p>
        </div>
        <div className="auth-brand-footer">
          <span>Existing account preserved.</span>
          <span>Recovery access is time-limited.</span>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <p className="eyebrow">SECURE RECOVERY</p>
          <h1>{resetToken ? "Choose a new password" : "Recover your account"}</h1>
          <p className="auth-card-intro">
            {resetToken
              ? "Your recovery token expires in 15 minutes and becomes unusable after your password is changed."
              : "Enter the email on your account and your temporary recovery code."}
          </p>

          {!resetToken ? (
            <form onSubmit={beginRecovery} className="auth-form">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <label htmlFor="recovery-key">Recovery code</label>
              <input
                id="recovery-key"
                type="password"
                autoComplete="one-time-code"
                value={recoveryKey}
                onChange={(event) => setRecoveryKey(event.target.value)}
                required
              />

              {error ? <p className="auth-error" role="alert">{error}</p> : null}
              {message ? <p className="auth-security-note">{message}</p> : null}

              <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? "Verifying…" : "Continue"}
              </button>
            </form>
          ) : (
            <form onSubmit={finishRecovery} className="auth-form">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />

              {error ? <p className="auth-error" role="alert">{error}</p> : null}
              {message ? <p className="auth-security-note">{message}</p> : null}

              <button className="auth-submit" type="submit" disabled={busy}>
                {busy ? "Updating…" : "Set new password"}
              </button>
            </form>
          )}

          {!resetToken && message ? null : <div className="auth-divider" />}
          <p className="auth-switch"><Link href="/login">Return to sign in</Link></p>
        </div>
      </section>
    </div>
  );
}
