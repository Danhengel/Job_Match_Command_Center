import type { ReactNode } from "react";

export type MetricItem = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <section className="page-header executive-page-header">
      <div className="executive-page-header-copy">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actions ? <div className="page-header-actions executive-page-header-actions">{actions}</div> : null}
    </section>
  );
}

export function SectionHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="executive-section-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p className="muted">{description}</p> : null}
      </div>
      {actions ? <div className="executive-section-actions">{actions}</div> : null}
    </div>
  );
}

export function MetricStrip({ items, ariaLabel }: { items: MetricItem[]; ariaLabel?: string }) {
  return (
    <section className="executive-metric-strip" aria-label={ariaLabel}>
      {items.map((item) => (
        <article key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.detail ? <small>{item.detail}</small> : null}
        </article>
      ))}
    </section>
  );
}

export function ExecutivePanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`executive-panel ${className}`.trim()}>{children}</section>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state-panel executive-empty-state">
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      {action}
    </div>
  );
}

export function Notice({ title, children, tone = "info" }: { title: string; children: ReactNode; tone?: "info" | "warning" | "error" | "success" }) {
  return (
    <section className={`notice notice-${tone} executive-notice`}>
      <strong>{title}</strong>
      <div>{children}</div>
    </section>
  );
}
