import type { Metadata, Viewport } from "next";
import "./visual-system.css";
import "./brand-logo.css";
import "./premium-home.css";
import "./homepage-background-fix.css";
import { AppShell } from "@/components/AppShell";
import { LegacyPersonalDefaultsGuard } from "@/components/LegacyPersonalDefaultsGuard";

const SITE_URL = "https://careernaviq.com";
const SITE_DESCRIPTION =
  "CareerNavIQ is a private executive career intelligence platform for positioning, market intelligence, opportunity management, relationship strategy, and interview preparation.";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "CareerNavIQ",
      url: SITE_URL,
      logo: `${SITE_URL}/careernaviq-logo.png?v=20260810`,
      description: SITE_DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "CareerNavIQ",
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
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
    default: "CareerNavIQ | Executive Career Intelligence",
    template: "%s | CareerNavIQ",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "executive career management",
    "executive job search",
    "career intelligence",
    "job application management",
    "resume optimization",
    "interview preparation",
    "career strategy",
  ],
  authors: [{ name: "CareerNavIQ", url: SITE_URL }],
  creator: "CareerNavIQ",
  publisher: "CareerNavIQ",
  category: "career technology",
  icons: {
    icon: "/careernaviq-mark.svg",
    shortcut: "/careernaviq-mark.svg",
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "CareerNavIQ",
    title: "CareerNavIQ | Executive Career Intelligence",
    description: SITE_DESCRIPTION,
    images: [{ url: "/careernaviq-logo.png?v=20260810", width: 1227, height: 223, alt: "CareerNavIQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CareerNavIQ | Executive Career Intelligence",
    description: SITE_DESCRIPTION,
    images: ["/careernaviq-logo.png?v=20260810"],
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
  themeColor: "#071b2c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="executive-platform-body">
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