import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicPage } from "@/components/PublicPage";
import { publicPages, publicPageSlugs } from "@/lib/publicPages";

const SITE_URL = "https://careernaviq.com";

type PublicPageProps = {
  params: Promise<{ publicSlug: string }>;
};

export function generateStaticParams() {
  return publicPageSlugs.map((publicSlug) => ({ publicSlug }));
}

export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { publicSlug } = await params;
  const page = publicPages[publicSlug];

  if (!page) {
    return {};
  }

  const canonical = `/${page.slug}`;

  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "CareerNavIQ",
      title: `${page.title} | CareerNavIQ`,
      description: page.description,
    },
    twitter: {
      card: "summary",
      title: `${page.title} | CareerNavIQ`,
      description: page.description,
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
    other: {
      "application-name": "CareerNavIQ",
      "og:url": `${SITE_URL}${canonical}`,
    },
  };
}

export default async function PublicSeoPage({ params }: PublicPageProps) {
  const { publicSlug } = await params;
  const page = publicPages[publicSlug];

  if (!page) {
    notFound();
  }

  return <PublicPage page={page} />;
}
