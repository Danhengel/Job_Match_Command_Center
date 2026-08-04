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
