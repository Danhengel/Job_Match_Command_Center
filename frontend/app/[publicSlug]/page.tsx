import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicPage } from "@/components/PublicPage";
import { publicPages, publicPageSlugs, type PublicPageData } from "@/lib/publicPages";

const SITE_URL = "https://careernaviq.com";

type PublicPageProps = {
  params: Promise<{ publicSlug: string }>;
};

function neutralizeCopy(value: string) {
  return value
    .replace(/Useful for individual contributors, managers, and executives/g, "Useful across roles, industries, and career stages")
    .replace(/a first professional search, a career change, a return to work, or an executive-level transition/g, "a first professional search, a career change, a return to work, or a major career transition")
    .replace(/Executive Career Intelligence/g, "Career Intelligence")
    .replace(/executive career intelligence/g, "career intelligence")
    .replace(/Executive Career/g, "Career")
    .replace(/executive career/g, "career")
    .replace(/Executive Job Search/g, "Job Search")
    .replace(/executive job search/g, "job search")
    .replace(/Executive Search/g, "Job Search")
    .replace(/executive search/g, "job search")
    .replace(/Executive Profile/g, "Career Profile")
    .replace(/executive profile/g, "career profile")
    .replace(/Executive Positioning/g, "Career Positioning")
    .replace(/executive positioning/g, "career positioning")
    .replace(/Executive-level/g, "Major")
    .replace(/executive-level/g, "major")
    .replace(/Executives/g, "Professionals")
    .replace(/executives/g, "professionals")
    .replace(/Executive/g, "Professional")
    .replace(/executive/g, "professional");
}

function neutralizePage(page: PublicPageData): PublicPageData {
  return {
    ...page,
    title: neutralizeCopy(page.title),
    eyebrow: neutralizeCopy(page.eyebrow),
    description: neutralizeCopy(page.description),
    intro: neutralizeCopy(page.intro),
    keywords: page.keywords.map(neutralizeCopy),
    cards: page.cards?.map((card) => ({
      ...card,
      title: neutralizeCopy(card.title),
      description: neutralizeCopy(card.description),
    })),
    sections: page.sections.map((section) => ({
      ...section,
      title: neutralizeCopy(section.title),
      paragraphs: section.paragraphs.map(neutralizeCopy),
      bullets: section.bullets?.map(neutralizeCopy),
    })),
    faqs: page.faqs?.map((faq) => ({
      question: neutralizeCopy(faq.question),
      answer: neutralizeCopy(faq.answer),
    })),
    primaryCta: page.primaryCta ? neutralizeCopy(page.primaryCta) : undefined,
    secondaryCta: page.secondaryCta ? neutralizeCopy(page.secondaryCta) : undefined,
  };
}

export function generateStaticParams() {
  return publicPageSlugs.map((publicSlug) => ({ publicSlug }));
}

export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { publicSlug } = await params;
  const sourcePage = publicPages[publicSlug];

  if (!sourcePage) {
    return {};
  }

  const page = neutralizePage(sourcePage);
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
  const sourcePage = publicPages[publicSlug];

  if (!sourcePage) {
    notFound();
  }

  return <PublicPage page={neutralizePage(sourcePage)} />;
}
