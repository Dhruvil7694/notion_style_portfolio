import { CopilotClient } from "./copilot-client"

export default function CopilotPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CMS Copilot</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Portfolio architect — audit content, suggest relationships, and generate missing fields.
        </p>
      </div>
      <CopilotClient />
    </div>
  )
}
