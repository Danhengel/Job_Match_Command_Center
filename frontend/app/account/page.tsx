"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { endAuthenticatedSession } from "@/lib/sessionStorage";

type NotificationPreferences = {
  job_matches: boolean;
  high_match: boolean;
  application_reminders: boolean;
  interview_reminders: boolean;
  resume_recommendations: boolean;
  product_updates: boolean;
  promotions: boolean;
};

type Account = {
  id: number;
  email: string;
  full_name: string;
  timezone: string;
  email_verified: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  password_changed_at: string | null;
  notifications: NotificationPreferences;
};

const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "Pacific/Honolulu",
];

function formatDate(value: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AccountPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    api("/api/account")
      .then((data: Account) => {
        setAccount(data);
        setFullName(data.full_name);
        setEmail(data.email);
        setTimezone(data.timezone);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load your account"));
  }, []);

  function showNotice(message: string) {
    setError("");
    setNotice(message);
    window.setTimeout(() => setNotice(""), 5000);
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) return;
    setBusy("profile");
    setError("");
    try {
      const response = await api("/api/account", {
        method: "PATCH",
        body: JSON.stringify({
          full_name: fullName,
          email,
          timezone,
          current_password: email !== account.email ? emailPassword : undefined,
        }),
      });
      if (response.access_token) localStorage.setItem("token", response.access_token);
      setAccount(response.account);
      setEmailPassword("");
      showNotice(email !== account.email ? "Account updated. Verify your new email address." : "Account information saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your account");
    } finally {
      setBusy("");
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("password");
    setError("");
    try {
      const response = await api("/api/account/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      localStorage.setItem("token", response.access_token);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setAccount((current) => current ? { ...current, password_changed_at: new Date().toISOString() } : current);
      showNotice(response.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to change your password");
    } finally {
      setBusy("");
    }
  }

  async function updateNotifications(next: NotificationPreferences) {
    if (!account) return;
    setBusy("notifications");
    setError("");
    try {
      const response = await api("/api/account/notifications", {
        method: "PATCH",
        body: JSON.stringify(next),
      });
      setAccount(response);
      showNotice("Notification preferences saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save notification preferences");
    } finally {
      setBusy("");
    }
  }

  async function resendVerification() {
    setBusy("verification");
    setError("");
    try {
      const response = await api("/api/auth/resend-verification", { method: "POST" });
      showNotice(response.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send verification email");
    } finally {
      setBusy("");
    }
  }

  async function signOutAll() {
    setBusy("logout");
    try {
      await api("/api/account/logout-all", { method: "POST" });
      endAuthenticatedSession();
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign out devices");
      setBusy("");
    }
  }

  async function downloadData() {
    setBusy("export");
    setError("");
    try {
      const payload = await api("/api/account/export");
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "careernaviq-account-data.json";
      anchor.click();
      URL.revokeObjectURL(url);
      showNotice("Your account data was downloaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to download your data");
    } finally {
      setBusy("");
    }
  }

  async function deleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("delete");
    setError("");
    try {
      await api("/api/account", {
        method: "DELETE",
        body: JSON.stringify({ password: deletePassword, confirmation: deleteConfirmation }),
      });
      endAuthenticatedSession();
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete your account");
      setBusy("");
    }
  }

  if (!account) {
    return <section className="account-loading"><p>{error || "Loading account settings…"}</p></section>;
  }

  const notificationLabels: Array<[keyof NotificationPreferences, string, string]> = [
    ["job_matches", "New job matches", "Alerts when a saved search finds new opportunities."],
    ["high_match", "High-match opportunities", "Priority alerts for especially strong matches."],
    ["application_reminders", "Application reminders", "Follow-ups and application deadlines."],
    ["interview_reminders", "Interview reminders", "Preparation and interview schedule alerts."],
    ["resume_recommendations", "Résumé recommendations", "Suggestions to strengthen your résumé."],
    ["product_updates", "Product announcements", "Updates about new CareerNavIQ features."],
    ["promotions", "CareerNavIQ offers", "Optional promotional messages."],
  ];

  return (
    <div className="account-page">
      <header className="account-hero">
        <div>
          <p className="eyebrow">ACCOUNT SETTINGS</p>
          <h1>Manage your CareerNavIQ account</h1>
          <p>Update your identity, security, notifications, and privacy controls.</p>
        </div>
        <div className={`verification-badge ${account.email_verified ? "verified" : "pending"}`}>
          <span>{account.email_verified ? "✓" : "!"}</span>
          {account.email_verified ? "Email verified" : "Verification needed"}
        </div>
      </header>

      {notice ? <div className="account-notice success" role="status">{notice}</div> : null}
      {error ? <div className="account-notice error" role="alert">{error}</div> : null}

      <div className="account-grid">
        <section className="account-card">
          <div className="account-card-heading">
            <div><p className="eyebrow">PERSONAL INFORMATION</p><h2>Your account</h2></div>
            <span>Member since {formatDate(account.created_at)}</span>
          </div>
          <form className="account-form" onSubmit={saveProfile}>
            <label htmlFor="full-name">Full name</label>
            <input id="full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            <label htmlFor="account-email">Email address</label>
            <input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            {email !== account.email ? (
              <>
                <label htmlFor="email-password">Current password to change email</label>
                <input id="email-password" type="password" autoComplete="current-password" value={emailPassword} onChange={(event) => setEmailPassword(event.target.value)} required />
              </>
            ) : null}
            <label htmlFor="timezone">Time zone</label>
            <select id="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)}>
              {timezones.map((zone) => <option key={zone} value={zone}>{zone.replace("_", " ")}</option>)}
            </select>
            <button className="button primary" type="submit" disabled={busy === "profile"}>{busy === "profile" ? "Saving…" : "Save changes"}</button>
          </form>
        </section>

        <section className="account-card">
          <div className="account-card-heading"><div><p className="eyebrow">LOGIN & SECURITY</p><h2>Password and sessions</h2></div></div>
          <p className="account-meta">Password last changed: {formatDate(account.password_changed_at)}</p>
          <form className="account-form" onSubmit={changePassword}>
            <label htmlFor="current-password">Current password</label>
            <input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
            <label htmlFor="new-password">New password</label>
            <input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
            <label htmlFor="confirm-password">Confirm new password</label>
            <input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
            <button className="button primary" type="submit" disabled={busy === "password"}>{busy === "password" ? "Changing…" : "Change password"}</button>
          </form>
          <div className="account-divider" />
          <div className="account-action-row">
            <div><strong>Email verification</strong><span>{account.email_verified ? `Verified ${formatDate(account.email_verified_at)}` : "Verify your email to strengthen account recovery."}</span></div>
            {!account.email_verified ? <button className="button secondary compact" type="button" onClick={resendVerification} disabled={busy === "verification"}>{busy === "verification" ? "Sending…" : "Resend email"}</button> : null}
          </div>
          <div className="account-action-row">
            <div><strong>Active sessions</strong><span>Immediately invalidate every signed-in device, including this one.</span></div>
            <button className="button secondary compact" type="button" onClick={signOutAll} disabled={busy === "logout"}>Sign out all devices</button>
          </div>
        </section>

        <section className="account-card account-card-wide">
          <div className="account-card-heading"><div><p className="eyebrow">NOTIFICATIONS</p><h2>Choose what reaches your inbox</h2></div><span>{busy === "notifications" ? "Saving…" : "Changes save immediately"}</span></div>
          <div className="notification-list">
            {notificationLabels.map(([key, title, description]) => (
              <label className="notification-row" key={key}>
                <span><strong>{title}</strong><small>{description}</small></span>
                <input
                  type="checkbox"
                  checked={account.notifications[key]}
                  onChange={(event) => updateNotifications({ ...account.notifications, [key]: event.target.checked })}
                  disabled={busy === "notifications"}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="account-card">
          <div className="account-card-heading"><div><p className="eyebrow">PRIVACY & DATA</p><h2>Your information</h2></div></div>
          <p className="account-meta">Download a JSON copy of your account and associated CareerNavIQ records.</p>
          <button className="button secondary" type="button" onClick={downloadData} disabled={busy === "export"}>{busy === "export" ? "Preparing…" : "Download my information"}</button>
        </section>

        <section className="account-card danger-card">
          <div className="account-card-heading"><div><p className="eyebrow">DANGER ZONE</p><h2>Delete account</h2></div></div>
          <p className="account-meta">This permanently removes your account and database records. This action cannot be undone.</p>
          <form className="account-form" onSubmit={deleteAccount}>
            <label htmlFor="delete-password">Current password</label>
            <input id="delete-password" type="password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} required />
            <label htmlFor="delete-confirmation">Type DELETE to confirm</label>
            <input id="delete-confirmation" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} pattern="DELETE" required />
            <button className="button danger" type="submit" disabled={busy === "delete" || deleteConfirmation !== "DELETE"}>{busy === "delete" ? "Deleting…" : "Delete my account"}</button>
          </form>
        </section>
      </div>
    </div>
  );
}
