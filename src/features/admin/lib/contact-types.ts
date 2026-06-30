export type AdminContactSubmission = {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  created_at: string
  read_at: string | null
}
