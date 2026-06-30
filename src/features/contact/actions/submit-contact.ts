"use server"

import { createClient } from "@/shared/lib/supabase/server"

type ContactFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string }

export async function submitContact(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const subject = String(formData.get("subject") ?? "").trim() || null
  const message = String(formData.get("message") ?? "").trim()

  if (!name || name.length > 200)
    return { status: "error", message: "Name is required (max 200 chars)." }
  if (!email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email))
    return { status: "error", message: "Valid email required." }
  if (!message || message.length > 5000)
    return { status: "error", message: "Message is required (max 5000 chars)." }

  const supabase = await createClient()
  const { error } = await supabase
    .from("contact_submissions")
    .insert({ name, email, subject, message })

  if (error) return { status: "error", message: "Failed to send. Try again." }
  return { status: "success" }
}
