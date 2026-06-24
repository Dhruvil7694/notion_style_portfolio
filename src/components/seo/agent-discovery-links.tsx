export function AgentDiscoveryLinks() {
  return (
    <>
      <link
        href="/agents.json"
        rel="alternate"
        title="Agent Action Map"
        type="application/json"
      />
      <link
        href="/llms.txt"
        rel="alternate"
        title="LLM Context"
        type="text/plain"
      />
      <link
        href="/agent-instructions.md"
        rel="alternate"
        title="Agent Runbook"
        type="text/markdown"
      />
    </>
  )
}
