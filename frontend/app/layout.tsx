import "./globals.css";
import "./careeros.css";
import "./sprint3.css";
import "./sprint5.css";
import "./sprint6.css";
import "./sprint7.css";
import "./sprint8.css";
import "./beta.css";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "CareerOS",
  description: "Find opportunities, track progress, and achieve more with an AI-assisted career command center.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
