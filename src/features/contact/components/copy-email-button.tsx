"use client"

import { Check, Copy } from "lucide-react"
import { useState } from "react"

type CopyEmailButtonProps = {
  email: string
}

export function CopyEmailButton({ email }: CopyEmailButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.location.href = `mailto:${email}`
    }
  }

  return (
    <button
      className="workspace-action-btn workspace-action-btn-outline"
      onClick={handleCopy}
      type="button"
    >
      {copied ? (
        <>
          <Check
            aria-hidden
            className="workspace-action-icon"
            strokeWidth={1.75}
          />
          Copied
        </>
      ) : (
        <>
          <Copy
            aria-hidden
            className="workspace-action-icon"
            strokeWidth={1.75}
          />
          Copy Email
        </>
      )}
    </button>
  )
}
