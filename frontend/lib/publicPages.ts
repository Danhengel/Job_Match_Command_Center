export type PublicPageCard = {
  title: string;
  description: string;
  icon?: string;
};

export type PublicPageSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type PublicPageFaq = {
  question: string;
  answer: string;
};

export type PublicPageData = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  intro: string;
  keywords: string[];
  cards?: PublicPageCard[];
  sections: PublicPageSection[];
  faqs?: PublicPageFaq[];
  primaryCta?: string;
  secondaryCta?: string;
  updated?: string;
  policy?: boolean;
};

export const publicPages: Record<string, PublicPageData> = {
  features: {
    slug: "features",
    title: "One navigation system for every stage of your career move",
    eyebrow: "CAREERNAVIQ FEATURES",
    description:
      "Explore CareerNavIQ features for AI-assisted job discovery, resume optimization, application tracking, recruiter management, interview preparation, and career insights.",
    intro:
      "CareerNavIQ replaces scattered job boards, spreadsheets, notes, documents, and reminders with one connected career-navigation system. Each feature helps you see where you are, choose what matters next, and move forward with less friction.",
    keywords: [
      "career management software",
      "AI job search platform",
      "job application tracker",
      "resume optimizer",
      "interview preparation tool",
    ],
    cards: [
      {
        icon: "⌕",
        title: "Smart job search",
        description:
          "Search, save, compare, and prioritize opportunities using your target roles, experience, location, remote preferences, and compensation goals.",
      },
      {
        icon: "✦",
        title: "Resume Studio",
        description:
          "Organize resume versions, identify gaps, and tailor your positioning to the responsibilities and language of a specific role.",
      },
      {
        icon: "✓",
        title: "Waypoint tracker",
        description:
          "Track every opportunity from discovery through application, interview, follow-up, offer, or closure without losing important next steps.",
      },
      {
        icon: "◇",
        title: "Network map",
        description:
          "Keep recruiter, hiring-manager, and networking conversations connected to the roles and follow-ups they support.",
      },
      {
        icon: "◎",
        title: "Interview path",
        description:
          "Build role-specific preparation plans, practice likely questions, and organize evidence-backed stories before each conversation.",
      },
      {
        icon: "↗",
        title: "Career insights",
        description:
          "Review activity, outcomes, bottlenecks, and priorities so your job-search strategy improves as you use it.",
      },
    ],
    sections: [
      {
        title: "A connected workflow instead of disconnected tools",
        paragraphs: [
          "Most job searches become harder than necessary because information lives in too many places. A promising role starts in a browser tab, the tailored resume is saved somewhere else, the recruiter conversation is buried in email, and the follow-up date is left to memory.",
          "CareerNavIQ connects those actions. A job can inform a tailored resume, the application can create a follow-up, the interview can use the same role research, and the outcome can improve future recommendations.",
        ],
      },
      {
        title: "Built around the decisions job seekers actually make",
        paragraphs: [
          "CareerNavIQ is organized around a practical route: set your direction, explore opportunities, prepare each move, track your waypoints, then navigate interviews. The platform is designed to show the next useful action rather than simply displaying more information.",
        ],
        bullets: [
          "Know which opportunities deserve your attention",
          "Keep role-specific materials and conversations together",
          "See deadlines and follow-ups before they are missed",
          "Prepare interviews using your own verified experience",
          "Use outcomes to improve your search strategy",
        ],
      },
      {
        title: "Useful for individual contributors, managers, and executives",
        paragraphs: [
          "The same workflow supports a first professional search, a career change, a return to work, or an executive-level transition. Users can adjust target roles, locations, compensation, seniority, and work preferences while keeping a reusable record of their experience and accomplishments.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is CareerNavIQ a job board?",
        answer:
          "CareerNavIQ is broader than a job board. It helps you discover opportunities, evaluate fit, prepare materials, track applications, manage contacts, and prepare for interviews along one connected route.",
      },
      {
        question: "Can I use CareerNavIQ for more than one target role?",
        answer:
          "Yes. You can organize multiple role targets and compare opportunities while maintaining one underlying career profile and resume library.",
      },
      {
        question: "Does CareerNavIQ replace my resume?",
        answer:
          "No. It helps you manage and improve resume versions so you can present the most relevant evidence for each opportunity.",
      },
    ],
    primaryCta: "Map my career route",
    secondaryCta: "Explore AI job search",
  },

  about: {
    slug: "about",
    title: "A clearer system for navigating your career",
    eyebrow: "ABOUT CAREERNAVIQ",
    description:
      "Learn why CareerNavIQ was created and how its career-navigation system helps job seekers organize opportunities, applications, relationships, and interview preparation.",
    intro:
      "CareerNavIQ was created around a simple idea: talented people should not need a patchwork of job boards, spreadsheets, documents, notes, and reminders to manage one of the most important transitions in their lives.",
    keywords: ["about CareerNavIQ", "career navigation system", "career technology platform"],
    cards: [
      {
        icon: "01",
        title: "Clarity before activity",
        description:
          "A successful search starts with clear targets, strong evidence, and thoughtful priorities—not simply applying to more jobs.",
      },
      {
        icon: "02",
        title: "One connected record",
        description:
          "Career experience, resumes, opportunities, applications, contacts, interviews, and outcomes should reinforce one another.",
      },
      {
        icon: "03",
        title: "Progress you can see",
        description:
          "A career transition feels more manageable when the next waypoint, important follow-up, and overall route are visible.",
      },
    ],
    sections: [
      {
        title: "The problem CareerNavIQ is solving",
        paragraphs: [
          "Job seekers are surrounded by tools that solve isolated tasks. One service finds jobs. Another edits a resume. A spreadsheet tracks applications. Calendar reminders manage follow-ups. Notes hold interview stories. The user is left to connect everything manually.",
          "That fragmentation creates duplicated effort and missed context. CareerNavIQ brings the work together so the information gathered for one step remains useful in the next.",
        ],
      },
      {
        title: "Our product philosophy",
        paragraphs: [
          "CareerNavIQ is designed to support judgment, not replace it. Recommendations should help users focus, compare, prepare, and decide. The user remains responsible for reviewing opportunities, verifying information, and choosing how to present their experience.",
        ],
        bullets: [
          "Make the next action clear",
          "Ground career materials in real experience",
          "Keep user information organized and reusable",
          "Reduce repetitive administrative work",
          "Improve through feedback and outcomes",
        ],
      },
      {
        title: "Built for continuous improvement",
        paragraphs: [
          "CareerNavIQ is currently evolving through early user feedback. The platform will continue to improve its workflows, guidance, reporting, and integrations while keeping the core experience focused on practical career progress.",
        ],
      },
    ],
    primaryCta: "Start using CareerNavIQ",
    secondaryCta: "View platform features",
  },

  pricing: {
    slug: "pricing",
    title: "Start building a better job-search system",
    eyebrow: "CAREERNAVIQ PRICING",
    description:
      "CareerNavIQ is currently available in early access. Review the current beta access model and what is included in the career-navigation system.",
    intro:
      "CareerNavIQ is currently in early access while the product is refined with real user feedback. Early-access users can explore the connected career-navigation system without committing to a paid plan.",
    keywords: ["CareerNavIQ pricing", "job search software pricing", "career platform early access"],
    cards: [
      {
        icon: "BETA",
        title: "Early access",
        description:
          "Create a career profile, organize resumes, discover opportunities, track applications, manage contacts, and prepare for interviews during the beta period.",
      },
      {
        icon: "✓",
        title: "No surprise purchase",
        description:
          "CareerNavIQ will clearly explain any future paid plan before a user is asked to subscribe or provide payment information.",
      },
      {
        icon: "↗",
        title: "Help shape the product",
        description:
          "Early users can provide feedback on workflows, priorities, and features as the platform develops.",
      },
    ],
    sections: [
      {
        title: "What is included in early access",
        paragraphs: [
          "Early access is intended to let users experience the full connected workflow rather than a limited demo. Availability of individual features may change as the platform is tested and improved.",
        ],
        bullets: [
          "Career profile and resume library",
          "Opportunity discovery and saved searches",
          "Application waypoints and follow-up tracking",
          "Recruiter and networking contact management",
          "Interview preparation and career reporting",
        ],
      },
      {
        title: "Future plans",
        paragraphs: [
          "CareerNavIQ may introduce paid plans for expanded usage, premium AI capabilities, advanced reporting, integrations, or team-based services. Final plan structure and pricing have not been announced.",
          "Existing users will receive clear notice before any material pricing change affects their access.",
        ],
      },
      {
        title: "Questions before joining?",
        paragraphs: [
          "Review the features and privacy information before creating an account. CareerNavIQ is designed as a career-management tool and does not guarantee interviews, offers, employment, compensation, or hiring outcomes.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is CareerNavIQ free right now?",
        answer:
          "CareerNavIQ is currently offered as early-access beta software. The registration experience will show the current access terms before you create an account.",
      },
      {
        question: "Will I be charged automatically later?",
        answer:
          "CareerNavIQ will not describe an early-access account as a paid subscription unless the user is shown and accepts clear billing terms.",
      },
      {
        question: "Does a plan guarantee job-search results?",
        answer:
          "No. CareerNavIQ provides organizational and preparation tools, but hiring decisions and outcomes depend on employers, market conditions, user actions, and other factors.",
      },
    ],
    primaryCta: "Create an early-access account",
    secondaryCta: "See what is included",
  },

  contact: {
    slug: "contact",
    title: "Get help with CareerNavIQ",
    eyebrow: "CONTACT CAREERNAVIQ",
    description:
      "Find the right way to contact CareerNavIQ for account help, product feedback, partnership inquiries, and early-access questions.",
    intro:
      "CareerNavIQ is in early access. Feedback from real job seekers helps identify what is working, what is unclear, and what should be improved next.",
    keywords: ["contact CareerNavIQ", "CareerNavIQ support", "CareerNavIQ feedback"],
    cards: [
      {
        icon: "?",
        title: "Account support",
        description:
          "Use the support or feedback option inside the CareerNavIQ application when you can sign in. Include the page you were using and what happened.",
      },
      {
        icon: "✦",
        title: "Product feedback",
        description:
          "Share which workflow you were trying to complete, what you expected, and what would make the experience more useful.",
      },
      {
        icon: "◇",
        title: "Partnership inquiries",
        description:
          "Career-service providers, workforce organizations, and potential integration partners can use the project contact channel during early access.",
      },
    ],
    sections: [
      {
        title: "Before reporting a technical issue",
        paragraphs: [
          "Refresh the page, confirm that you are using the current CareerNavIQ domain, and try the same action once more. Avoid sending passwords, full payment information, government identification numbers, or other highly sensitive information in a support message.",
        ],
        bullets: [
          "Describe the action you attempted",
          "Include the page or feature name",
          "Share the exact error message when available",
          "Explain whether the issue happens repeatedly",
          "Remove confidential employer or candidate information from screenshots",
        ],
      },
      {
        title: "Response expectations during early access",
        paragraphs: [
          "CareerNavIQ does not currently promise continuous or immediate support. Messages are reviewed as capacity permits, with priority generally given to account-access problems, security concerns, and issues that prevent core workflows from functioning.",
        ],
      },
      {
        title: "Security concerns",
        paragraphs: [
          "Do not publicly post details that could help someone misuse an account or system. Report suspected unauthorized access through the available private support channel and change affected credentials immediately.",
        ],
      },
    ],
    primaryCta: "Create or access my account",
    secondaryCta: "Review privacy information",
  },

  "ai-job-search": {
    slug: "ai-job-search",
    title: "Use AI to focus your job search—not flood it",
    eyebrow: "AI JOB SEARCH",
    description:
      "Learn how CareerNavIQ uses an organized career profile and job criteria to support smarter AI-assisted job discovery, comparison, and prioritization.",
    intro:
      "An effective AI job search should do more than return a long list of openings. It should help you identify which roles align with your experience, goals, location, work preferences, and compensation expectations—and explain what deserves a closer look.",
    keywords: [
      "AI job search",
      "AI job matching",
      "find jobs matching my resume",
      "career opportunity matching",
      "smart job search tool",
    ],
    cards: [
      {
        icon: "1",
        title: "Define the target",
        description:
          "Set role families, seniority, industries, locations, remote preferences, compensation, and other priorities before evaluating opportunities.",
      },
      {
        icon: "2",
        title: "Compare evidence",
        description:
          "Evaluate responsibilities and requirements against your documented experience rather than relying only on a job title.",
      },
      {
        icon: "3",
        title: "Prioritize action",
        description:
          "Separate strong-fit roles, stretch opportunities, and low-priority listings so your time goes to the most promising work.",
      },
    ],
    sections: [
      {
        title: "Why more job listings do not automatically create a better search",
        paragraphs: [
          "Search engines and job boards can surface thousands of openings, but volume creates its own problem. Users spend time opening repetitive listings, comparing inconsistent titles, and deciding whether requirements are truly important.",
          "CareerNavIQ is designed to add structure around discovery. Your profile and preferences create a consistent lens for evaluating opportunities, while saved searches and career watches help organize where new roles come from.",
        ],
      },
      {
        title: "What an AI-assisted match should help you understand",
        paragraphs: [
          "A useful match is not a promise that an employer will hire you. It is a decision aid that helps you review alignment and decide whether the opportunity deserves additional research, tailoring, networking, or application effort.",
        ],
        bullets: [
          "Which responsibilities closely match your experience",
          "Where your background provides transferable evidence",
          "Which requirements may represent genuine gaps",
          "Whether location and work arrangements fit your preferences",
          "What information still needs human verification",
        ],
      },
      {
        title: "Keep a human review in the loop",
        paragraphs: [
          "Job descriptions can be incomplete, outdated, duplicated, or written inconsistently. Compensation and location details may change. CareerNavIQ can help organize and compare information, but users should verify important facts on the employer's official posting before applying or making decisions.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can AI tell me whether I will get an interview?",
        answer:
          "No. AI can help assess apparent alignment, but employers consider many factors and control their own screening and hiring decisions.",
      },
      {
        question: "Should I apply only to the highest-scoring jobs?",
        answer:
          "Not necessarily. A score is one input. Your interest, network, transferable experience, timing, and the quality of the underlying job information also matter.",
      },
      {
        question: "Does CareerNavIQ apply to jobs automatically?",
        answer:
          "CareerNavIQ is designed to help users make intentional application decisions and manage the workflow. Users should review all materials and submissions for accuracy.",
      },
    ],
    primaryCta: "Build my job-search profile",
    secondaryCta: "Explore all features",
  },

  "job-application-tracker": {
    slug: "job-application-tracker",
    title: "Track every job application and the next action it needs",
    eyebrow: "JOB APPLICATION TRACKER",
    description:
      "Organize job applications, stages, follow-ups, contacts, interviews, notes, and deadlines in the CareerNavIQ waypoint tracker.",
    intro:
      "A job application tracker should answer more than where you applied. It should show what changed, who is involved, what is due next, and where your attention can improve the outcome.",
    keywords: [
      "job application tracker",
      "application tracking spreadsheet alternative",
      "track job applications",
      "job search organizer",
      "career route tracker",
    ],
    cards: [
      {
        icon: "✓",
        title: "Route visibility",
        description:
          "See opportunities across saved, preparing, applied, interviewing, offer, closed, and other meaningful stages.",
      },
      {
        icon: "◷",
        title: "Follow-up control",
        description:
          "Connect next actions and dates to the application so important outreach does not depend on memory.",
      },
      {
        icon: "◇",
        title: "People and context",
        description:
          "Keep recruiter, referral, hiring-manager, and interview information connected to the relevant opportunity.",
      },
    ],
    sections: [
      {
        title: "Why spreadsheets become difficult during an active search",
        paragraphs: [
          "A spreadsheet can record a company, title, date, and status. It becomes harder when one opportunity includes several resume versions, multiple contacts, interview rounds, notes, deadlines, and follow-up commitments.",
          "CareerNavIQ treats the application as a connected record. The opportunity, tailored materials, conversations, tasks, and outcomes remain available together as the process changes.",
        ],
      },
      {
        title: "What to track for each application",
        paragraphs: [
          "The most useful tracker fields are the ones that drive decisions and action. CareerNavIQ emphasizes the current stage, priority, next step, responsible contact, important dates, and supporting materials.",
        ],
        bullets: [
          "Official job title, company, and posting source",
          "Application date and current stage",
          "Resume or materials used",
          "Recruiters, referrals, and hiring contacts",
          "Follow-up date and next action",
          "Interview schedule, preparation, and outcome",
        ],
      },
      {
        title: "Use outcomes to improve the next application",
        paragraphs: [
          "Tracking is most valuable when it reveals patterns. A low response rate may suggest targeting or positioning needs work. Strong interview conversion may indicate that the resume is effective but later-stage preparation needs attention. CareerNavIQ's reporting tools are designed to turn activity into useful feedback.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I track jobs before I apply?",
        answer:
          "Yes. Saving and prioritizing opportunities before application helps you plan research, tailoring, networking, and deadlines.",
      },
      {
        question: "Can I connect recruiter contacts to applications?",
        answer:
          "CareerNavIQ includes recruiter and networking contact management so conversations can stay connected to relevant opportunities and follow-ups.",
      },
      {
        question: "Will the tracker remind me to follow up?",
        answer:
          "CareerNavIQ includes notification and calendar workflows designed to surface upcoming actions. Users should still review their dashboard and verify important dates.",
      },
    ],
    primaryCta: "Start tracking applications",
    secondaryCta: "See CareerNavIQ features",
  },

  "resume-optimizer": {
    slug: "resume-optimizer",
    title: "Optimize your resume around real evidence and the target role",
    eyebrow: "RESUME OPTIMIZER",
    description:
      "Use CareerNavIQ to organize resume versions, compare a resume with a job description, identify alignment, and strengthen role-specific positioning.",
    intro:
      "Resume optimization should make your real experience easier to understand. It should not invent qualifications, inflate results, or turn every application into the same collection of generic keywords.",
    keywords: [
      "resume optimizer",
      "AI resume tailoring",
      "tailor resume to job description",
      "resume keyword matching",
      "ATS resume improvement",
    ],
    cards: [
      {
        icon: "1",
        title: "Start with a verified career profile",
        description:
          "Organize roles, accomplishments, skills, scope, and measurable outcomes before tailoring language for an opportunity.",
      },
      {
        icon: "2",
        title: "Compare role requirements",
        description:
          "Identify strong alignment, transferable evidence, missing context, and requirements that should not be claimed without support.",
      },
      {
        icon: "3",
        title: "Create a focused version",
        description:
          "Prioritize the experience most relevant to the role while keeping statements accurate, specific, and easy to verify.",
      },
    ],
    sections: [
      {
        title: "Tailoring is prioritization, not reinvention",
        paragraphs: [
          "A strong resume does not need to include every responsibility from every role. It should help the reader quickly understand the experience that matters most for the opportunity in front of them.",
          "CareerNavIQ's Resume Studio is designed to help users manage source material and role-specific versions without losing the underlying record of what is true.",
        ],
      },
      {
        title: "What to review against a job description",
        paragraphs: [
          "Job descriptions vary in quality, so keyword overlap alone is not enough. Review the outcomes the employer needs, the scope of responsibility, required technical knowledge, leadership expectations, and evidence that demonstrates comparable work.",
        ],
        bullets: [
          "Core responsibilities and business outcomes",
          "Required versus preferred qualifications",
          "Leadership, budget, portfolio, or team scope",
          "Industry and regulatory context",
          "Tools, systems, methods, and technical skills",
          "Language that is accurate for your experience",
        ],
      },
      {
        title: "Review every generated suggestion",
        paragraphs: [
          "AI-assisted writing can be useful for structure and clarity, but the user must confirm that every statement is accurate. Do not include a credential, result, responsibility, employer, date, or skill that cannot be supported.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does CareerNavIQ write an entire resume automatically?",
        answer:
          "CareerNavIQ supports resume organization and role-specific improvement. Users remain responsible for reviewing and approving all content.",
      },
      {
        question: "Should every keyword from a job description be added?",
        answer:
          "No. Include terminology only when it accurately describes your experience. Relevance and evidence matter more than copying every phrase.",
      },
      {
        question: "Can I keep multiple resume versions?",
        answer:
          "Yes. The resume library and Resume Studio are designed to support source resumes and targeted versions for different role families or opportunities.",
      },
    ],
    primaryCta: "Build my resume library",
    secondaryCta: "Explore application tracking",
  },

  "interview-preparation": {
    slug: "interview-preparation",
    title: "Prepare for interviews with better evidence, structure, and focus",
    eyebrow: "INTERVIEW PREPARATION",
    description:
      "Prepare for job interviews with CareerNavIQ role research, likely questions, evidence-based stories, talking points, follow-ups, and interview tracking.",
    intro:
      "Interview preparation becomes more effective when it connects the employer's needs to specific evidence from your background. CareerNavIQ helps organize that work so you can enter each conversation with a clear message and credible examples.",
    keywords: [
      "interview preparation",
      "AI interview coach",
      "job interview questions",
      "STAR interview stories",
      "executive interview preparation",
    ],
    cards: [
      {
        icon: "⌕",
        title: "Understand the role",
        description:
          "Review the responsibilities, likely priorities, company context, and gaps that need clarification during the conversation.",
      },
      {
        icon: "✦",
        title: "Select the right stories",
        description:
          "Match accomplishments and lessons from your background to the capabilities the interviewer is likely to evaluate.",
      },
      {
        icon: "◎",
        title: "Practice with purpose",
        description:
          "Prepare concise openings, structured examples, thoughtful questions, and clear explanations for transitions or gaps.",
      },
    ],
    sections: [
      {
        title: "Prepare a message, not a memorized script",
        paragraphs: [
          "Strong candidates know the few ideas they want the interviewer to remember. They can explain why the role fits, which experience is most relevant, and how they approach the problems the employer needs solved.",
          "CareerNavIQ helps organize those ideas into role-specific talking points while preserving flexibility for a natural conversation.",
        ],
      },
      {
        title: "Build an evidence library before you need it",
        paragraphs: [
          "Behavioral questions often repeat themes: leadership, judgment, conflict, change, execution, customer impact, failure, risk, and measurable results. Maintaining a reusable library of accurate examples reduces last-minute preparation and helps you choose the best story for each role.",
        ],
        bullets: [
          "Situation and business context",
          "Your specific responsibility",
          "Actions and judgment you personally contributed",
          "Measurable or observable result",
          "Lesson learned and how it changed later work",
        ],
      },
      {
        title: "Use the interview to evaluate the opportunity too",
        paragraphs: [
          "Preparation is not only about answering questions. It should help you evaluate scope, expectations, resources, decision authority, culture, compensation, work arrangements, and the reasons the position is open.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can CareerNavIQ predict every interview question?",
        answer:
          "No. It can help identify likely themes and questions based on the role, but interviewers may take the conversation in other directions.",
      },
      {
        question: "Should I memorize STAR answers word for word?",
        answer:
          "Usually not. Know the facts, sequence, result, and lesson so you can answer naturally and adjust the level of detail.",
      },
      {
        question: "Can I track multiple interview rounds?",
        answer:
          "CareerNavIQ's interview and application workflows are designed to keep rounds, contacts, preparation, notes, and follow-ups connected to the opportunity.",
      },
    ],
    primaryCta: "Prepare for my next interview",
    secondaryCta: "Explore the application tracker",
  },

  privacy: {
    slug: "privacy",
    title: "Privacy Notice",
    eyebrow: "CAREERNAVIQ PRIVACY",
    description:
      "Review the CareerNavIQ early-access privacy notice, including the information the service may process, how it is used, and choices available to users.",
    intro:
      "This notice explains, in general terms, how CareerNavIQ handles information during early access. It is a beta notice and should be reviewed by qualified privacy counsel before broad commercial launch.",
    keywords: ["CareerNavIQ privacy", "CareerNavIQ data policy"],
    updated: "August 5, 2026",
    policy: true,
    sections: [
      {
        title: "Information you provide",
        paragraphs: [
          "CareerNavIQ may process information you enter or upload, including your name, email address, account credentials, career profile, employment history, resumes, job preferences, saved opportunities, applications, contacts, interview notes, and feedback.",
          "Do not upload information you do not have the right to use. Avoid including government identification numbers, financial account details, medical information, or other highly sensitive data that is not needed for the service.",
        ],
      },
      {
        title: "Information generated through use of the service",
        paragraphs: [
          "The service may create or store usage information such as feature activity, saved searches, workflow status, timestamps, technical logs, device or browser information, and outputs generated from the information you provide.",
        ],
      },
      {
        title: "How information may be used",
        paragraphs: [
          "CareerNavIQ may use information to provide and secure the service, authenticate accounts, save user work, generate requested career assistance, improve workflows, diagnose problems, communicate about the service, and comply with legal obligations.",
        ],
      },
      {
        title: "Service providers and disclosures",
        paragraphs: [
          "CareerNavIQ may rely on hosting, database, infrastructure, analytics, job-data, communication, and AI technology providers to operate the service. Information may be disclosed when reasonably necessary to provide those services, protect users or the platform, respond to lawful requests, or complete a business transaction subject to appropriate safeguards.",
          "CareerNavIQ does not represent that employers or recruiters receive user information unless the user directs or initiates an action that shares it.",
        ],
      },
      {
        title: "Data retention and security",
        paragraphs: [
          "Information may be retained while an account is active and for a reasonable period afterward for backup, security, dispute resolution, legal, and operational purposes. No online service can guarantee absolute security, and users are responsible for protecting their passwords and devices.",
        ],
      },
      {
        title: "Your choices",
        paragraphs: [
          "Users may review or update information through available account features. Requests to access, correct, or delete information may be subject to identity verification, technical limitations, legal exceptions, and retention requirements.",
        ],
      },
      {
        title: "Children and geographic availability",
        paragraphs: [
          "CareerNavIQ is not designed for children under 13. Early access may not be appropriate or available in every jurisdiction. Users are responsible for determining whether the service is suitable for their circumstances.",
        ],
      },
      {
        title: "Changes to this notice",
        paragraphs: [
          "This notice may be updated as the service and its data practices change. Material changes should be communicated through the website, application, or other appropriate means.",
        ],
      },
    ],
    secondaryCta: "Review the Terms",
  },

  terms: {
    slug: "terms",
    title: "Early-Access Terms of Use",
    eyebrow: "CAREERNAVIQ TERMS",
    description:
      "Review the CareerNavIQ early-access terms covering account use, user content, AI-assisted outputs, acceptable use, service changes, and important disclaimers.",
    intro:
      "These terms are an early-access draft for the CareerNavIQ beta. They should be reviewed and adapted by qualified legal counsel before broad commercial use or paid subscriptions are introduced.",
    keywords: ["CareerNavIQ terms", "CareerNavIQ terms of use"],
    updated: "August 5, 2026",
    policy: true,
    sections: [
      {
        title: "Using CareerNavIQ",
        paragraphs: [
          "You may use CareerNavIQ only if you can form a binding agreement and your use is lawful. You are responsible for the accuracy of account information, maintaining the confidentiality of credentials, and activity performed through your account.",
        ],
      },
      {
        title: "Early-access service",
        paragraphs: [
          "CareerNavIQ is evolving beta software. Features may be incomplete, changed, suspended, or removed. Availability, performance, data compatibility, and continued access are not guaranteed during early access.",
        ],
      },
      {
        title: "User content and permissions",
        paragraphs: [
          "You retain responsibility for resumes, career information, job materials, notes, and other content you provide. You grant CareerNavIQ the permission reasonably necessary to host, process, reproduce, and transform that content to operate and improve the requested service.",
          "You represent that you have the rights needed to provide the content and that it does not unlawfully violate another person's rights or confidentiality obligations.",
        ],
      },
      {
        title: "AI-assisted features",
        paragraphs: [
          "AI-generated matches, summaries, recommendations, and writing suggestions may be incomplete, inaccurate, or inappropriate. You must review outputs before relying on, sharing, or submitting them. Do not use generated content to misrepresent qualifications, experience, credentials, or results.",
        ],
      },
      {
        title: "Acceptable use",
        paragraphs: [
          "You may not misuse the service, interfere with its operation, attempt unauthorized access, scrape or reproduce protected portions at scale, upload malicious code, violate law, impersonate another person, or use the service to deceive employers, candidates, or other users.",
        ],
      },
      {
        title: "Employment and third-party services",
        paragraphs: [
          "CareerNavIQ is a career-management tool. It is not an employer, staffing agency, background-check provider, attorney, financial adviser, or guarantor of interviews, offers, compensation, or employment. Third-party job listings, websites, integrations, and services are controlled by their respective providers.",
        ],
      },
      {
        title: "Disclaimers and limitation of responsibility",
        paragraphs: [
          "To the extent permitted by law, the early-access service is provided on an as-is and as-available basis without promises that it will be uninterrupted, error-free, or suitable for a particular outcome. Users remain responsible for career decisions and submissions.",
          "Any final limitation-of-liability, indemnity, dispute-resolution, governing-law, and warranty language must be reviewed by qualified counsel before commercial launch.",
        ],
      },
      {
        title: "Suspension, termination, and changes",
        paragraphs: [
          "CareerNavIQ may restrict or terminate access when reasonably necessary to protect the service, users, third parties, or legal interests. These terms may change as the product develops; continued use after notice may be treated as acceptance where permitted by law.",
        ],
      },
    ],
    secondaryCta: "Review the Privacy Notice",
  },
};

export const publicPageSlugs = Object.keys(publicPages);
