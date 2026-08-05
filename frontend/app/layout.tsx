import "./globals.css";
import "./careeros.css";
import "./auth.css";
import "./sprint3.css";
import "./sprint5.css";
import "./sprint6.css";
import "./sprint7.css";
import "./sprint8.css";
import "./brand-colors.css";
import "./landing.css";
import "./mobile.css";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "CareerNavIQ",
  description: "AI-powered career search, application management, and interview preparation.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
