import "./globals.css";
import "./sprint1.css";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "CareerOS",
  description: "A guided career platform for profile building, job discovery, application preparation, and interview success.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
