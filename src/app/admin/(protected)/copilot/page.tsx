import { CopilotClient } from "./copilot-client"

export default function CopilotPage() {
  return (
    <div className="flex h-full min-h-0 flex-col p-2 md:p-3">
      <CopilotClient />
    </div>
  )
}
