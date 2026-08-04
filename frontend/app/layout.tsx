import "./globals.css";
import "./careeros.css";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "CareerOS",
  description: "AI-powered career search, application management, and interview preparation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
