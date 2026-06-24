import type { PublicSettings } from "@/lib/public/settings"

export type PrivacySection = {
  id: string
  title: string
  paragraphs: string[]
}

export function buildPrivacySections(
  settings: PublicSettings
): PrivacySection[] {
  const ownerName = settings.site.owner_name?.trim() || "Dhruvil Patel"
  const contactEmail =
    settings.contact.email?.trim() || "the contact email on this site"

  return [
    {
      id: "overview",
      title: "Overview",
      paragraphs: [
        `${ownerName} operates this portfolio website. This policy explains what information is collected, how it is used, and your choices.`,
        "Last updated: June 24, 2026.",
      ],
    },
    {
      id: "information-we-collect",
      title: "Information we collect",
      paragraphs: [
        "Usage analytics such as page views, device type, browser, and approximate location (via analytics tools).",
        "Error and performance diagnostics when something fails in the application (via error monitoring).",
        "Messages you send through the AI assistant chat, used to generate responses and improve reliability.",
        "Information you voluntarily provide via email or contact links.",
      ],
    },
    {
      id: "how-we-use-information",
      title: "How we use information",
      paragraphs: [
        "To operate, secure, and improve the website and its features.",
        "To understand which content is useful and to fix bugs.",
        "To respond to inquiries and provide AI assistant functionality.",
        "We do not sell your personal information.",
      ],
    },
    {
      id: "third-party-services",
      title: "Third-party services",
      paragraphs: [
        "This site uses trusted infrastructure and analytics providers, including Vercel (hosting), Supabase (database and authentication), PostHog (analytics), and Sentry (error monitoring).",
        "AI assistant features may route prompts to configured model providers according to site settings.",
        "Each provider processes data under its own privacy policy and security practices.",
      ],
    },
    {
      id: "cookies-and-storage",
      title: "Cookies and local storage",
      paragraphs: [
        "The site may store theme preferences and session-related data in your browser.",
        "Analytics and monitoring tools may use cookies or similar technologies.",
        "You can control cookies through your browser settings.",
      ],
    },
    {
      id: "data-retention",
      title: "Data retention",
      paragraphs: [
        "Analytics and error logs are retained only as long as needed for operations, security, and product improvement.",
        "Contact messages are retained as needed to respond and maintain correspondence history.",
      ],
    },
    {
      id: "your-rights",
      title: "Your rights",
      paragraphs: [
        "You may request access, correction, or deletion of personal data associated with your interactions with this site.",
        `To make a request, contact ${contactEmail}.`,
      ],
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [`For privacy questions, contact ${contactEmail}.`],
    },
  ]
}
