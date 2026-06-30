"use client"

import { CheckCircle2, Loader2, Send } from "lucide-react"
import { useActionState } from "react"

import { submitContact } from "@/features/contact/actions/submit-contact"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, {
    status: "idle",
  })

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-500" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Message sent
          </p>
        </div>
        <p className="text-muted-foreground text-xs">
          {"I'll"} get back to you as soon as possible.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            maxLength={200}
            name="name"
            placeholder="Your name"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-subject">
          Subject{" "}
          <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="contact-subject"
          maxLength={200}
          name="subject"
          placeholder="What's this about?"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          className="min-h-[120px] resize-y"
          id="contact-message"
          maxLength={5000}
          name="message"
          placeholder="Your message..."
          required
        />
      </div>

      {state.status === "error" ? (
        <p className="text-destructive text-xs">{state.message}</p>
      ) : null}

      <Button className="gap-2" disabled={pending} type="submit">
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Send className="size-3.5" />
        )}
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  )
}
