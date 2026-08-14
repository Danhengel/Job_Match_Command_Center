import Link from "next/link";

type SiteFooterProps = {
  variant?: "app" | "auth";
};

export function SiteFooter({ variant = "app" }: SiteFooterProps) {
  return (
    <footer className={`site-footer site-footer-${variant}`} aria-label="CareerNavIQ footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <strong>CareerNavIQ</strong>
          <span>Executive career intelligence</span>
        </div>

        <nav className="site-footer-links" aria-label="Footer navigation">
          <Link href="/about">About</Link>
          <Link href="/contact">Help</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>

      <div className="site-footer-meta">
        <span>© {new Date().getFullYear()} CareerNavIQ</span>
        <span>Clarity for the next move.</span>
      </div>
    </footer>
  );
}
