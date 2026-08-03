import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <section className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </section>
  );
}

export function StatCard({ label, value, detail }: { label: string; value: number | string; detail?: string }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-block">
      {label ? <div className="progress-label"><span>{label}</span><strong>{safeValue}%</strong></div> : null}
      <div className="progress-track" aria-label={label || "Progress"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue} role="progressbar">
        <div className="progress-value" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state-panel">
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      {action}
    </div>
  );
}

export function Notice({ title, children, tone = "info" }: { title: string; children: ReactNode; tone?: "info" | "warning" | "error" | "success" }) {
  return (
    <section className={`notice notice-${tone}`}>
      <strong>{title}</strong>
      <div>{children}</div>
    </section>
  );
}
