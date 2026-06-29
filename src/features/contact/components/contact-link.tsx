"use client"

import { captureEvent } from "@/shared/lib/analytics/posthog-client"

type ContactLinkProps = {
  href: string
  channel: "email" | "calendly" | "social"
  target?: string
  children: React.ReactNode
  className?: string
  rel?: string
}

export function ContactLink({
  href,
  channel,
  target,
  children,
  className,
  rel,
}: ContactLinkProps) {
  return (
    <a
      className={className}
      href={href}
      onClick={() => captureEvent("contact_click", { channel, target: href })}
      rel={rel}
      target={target}
    >
      {children}
    </a>
  )
}
