import type { Metadata, Viewport } from "next";
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
import "./public-pages.css";
import "./mobile.css";
import "./public-readability.css";
import "./design-system.css";
import "./page-modernization.css";
import "./company-modernization.css";
import "./insight-modernization.css";
import "./operational-modernization.css";
import "./settings-modernization.css";
import "./workspace-modernization.css";
import "./auth-modernization.css";
import "./resume-layout.css";
import "./company-watch-catalog.css";
import "./experience-overhaul.css";
import "./premium-visual-system.css";
import "./contrast-repair.css";
import "./premium-platform-v3.css";
import { AppShell } from "@/components/AppShell";
import { LegacyPersonalDefaultsGuard } from "@/components/LegacyPersonalDefaultsGuard";

const SITE_URL = "https://careernaviq.com";
const SITE_DESCRIPTION =
  "CareerNavIQ is an AI-powered career command center for finding stronger-fit jobs, tailoring resumes, tracking applications, and preparing for interviews.";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "CareerNavIQ",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "CareerNavIQ",
      description: SITE_DESCRIPTION,
      publisher: {
        "@id": `${SITE_URL}/#organization`,
      },
      inLanguage: "en-US",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#application`,
      name: "CareerNavIQ",
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: SITE_DESCRIPTION,
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "CareerNavIQ",
  title: {
    default: "CareerNavIQ | AI-Powered Career Command Center",
    template: "%s | CareerNavIQ",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "AI job search",
    "job application tracker",
    "resume optimization",
    "interview preparation",
    "career management",
    "career command center",
  ],
  authors: [{ name: "CareerNavIQ", url: SITE_URL }],
  creator: "CareerNavIQ",
  publisher: "CareerNavIQ",
  category: "career technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "CareerNavIQ",
    title: "CareerNavIQ | Navigate Your Next Career Move",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: "CareerNavIQ | Navigate Your Next Career Move",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#10213D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <LegacyPersonalDefaultsGuard />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
