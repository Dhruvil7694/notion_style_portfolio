/**
 * Interactive architecture graphs for project case studies.
 * Layout grid: center x=380, left x=40, right x=720, row step y=180
 */

function node(id, type, label, x, y, description = "", icon = "") {
  return { id, type, label, description, icon, position: { x, y } }
}

function edge(id, source, target, label = "", animated = false) {
  return { id, source, target, label, animated }
}

const CX = 380
const LX = 40
const RX = 720
const Y = (row) => row * 180

export const ARCHITECTURE_GRAPHS_BY_SLUG = {
  "bohrai-research-platform": {
    ai_design_nodes: [
      node("researcher", "user", "Researcher", CX, Y(0)),
      node("planner", "agent", "Planning Agent", CX, Y(1), "", "Bot"),
      node("research", "agent", "Research Agent", LX, Y(2), "", "Bot"),
      node("validation", "agent", "Validation Agent", RX, Y(2), "", "Shield"),
      node("retriever", "tool", "Hybrid Retriever", LX, Y(3), "", "Search"),
      node("writer", "agent", "Writer Agent", CX, Y(4), "", "Bot"),
      node("report", "service", "Final Report", CX, Y(5), "", "FileText"),
    ],
    ai_design_edges: [
      edge("e1", "researcher", "planner"),
      edge("e2", "planner", "research", "", true),
      edge("e3", "planner", "validation", "", true),
      edge("e4", "research", "retriever", "Search"),
      edge("e5", "research", "validation", "Evidence"),
      edge("e6", "validation", "writer", "Validated"),
      edge("e7", "writer", "report", "Draft"),
    ],
    architecture_nodes: [
      node("user", "user", "Researcher", CX, Y(0)),
      node("api", "service", "FastAPI Gateway", CX, Y(1), "", "Server"),
      node("orchestrator", "service", "LangGraph Orchestrator", CX, Y(2), "", "Workflow"),
      node("agents", "agent", "Agent Network", CX, Y(3), "", "Bot"),
      node("retriever", "tool", "Literature APIs", LX, Y(3), "", "Globe"),
      node("storage", "database", "Checkpoint Store", RX, Y(3), "", "Database"),
      node("output", "service", "Research Report", CX, Y(4), "", "FileText"),
    ],
    architecture_edges: [
      edge("a1", "user", "api"),
      edge("a2", "api", "orchestrator"),
      edge("a3", "orchestrator", "agents", "Execute", true),
      edge("a4", "agents", "retriever", "Query"),
      edge("a5", "agents", "storage", "Checkpoint"),
      edge("a6", "agents", "output", "Report"),
    ],
  },

  "enterprise-file-governance": {
    ai_design_nodes: [
      node("operator", "user", "Security Operator", CX, Y(0)),
      node("router", "agent", "Intent Router", CX, Y(1), "", "Bot"),
      node("assistant", "agent", "Tool-Calling Agent", CX, Y(2), "", "Bot"),
      node("policy", "service", "Policy Engine", RX, Y(2), "", "Shield"),
      node("executor", "service", "Action Executor", CX, Y(3), "", "Server"),
      node("approval", "user", "Approval Queue", RX, Y(3)),
      node("audit", "database", "Audit Log", CX, Y(4), "", "Database"),
    ],
    ai_design_edges: [
      edge("e1", "operator", "router"),
      edge("e2", "router", "assistant"),
      edge("e3", "assistant", "policy", "Policy lookup"),
      edge("e4", "assistant", "executor"),
      edge("e5", "executor", "approval", "Review"),
      edge("e6", "approval", "executor", "Approved"),
      edge("e7", "executor", "audit", "Log"),
    ],
    architecture_nodes: [
      node("endpoint", "user", "Windows Endpoint", LX, Y(0)),
      node("agent", "service", "Windows Agent", LX, Y(1), "", "Server"),
      node("api", "service", "FastAPI Backend", CX, Y(1), "", "Server"),
      node("postgres", "database", "PostgreSQL", RX, Y(1), "", "Database"),
      node("stream", "queue", "SSE Stream", CX, Y(2), "", "Workflow"),
      node("llm", "llm", "LLM Assistant", CX, Y(3), "", "Sparkles"),
      node("console", "user", "Admin Console", CX, Y(4)),
    ],
    architecture_edges: [
      edge("a1", "endpoint", "agent"),
      edge("a2", "agent", "api", "Events"),
      edge("a3", "api", "postgres", "Persist"),
      edge("a4", "api", "stream", "Updates", true),
      edge("a5", "console", "llm"),
      edge("a6", "llm", "api", "Tool calls"),
      edge("a7", "stream", "console", "Live stream"),
    ],
  },

  "nl-to-sql-platform": {
    ai_design_nodes: [
      node("user", "user", "Business User", CX, Y(0)),
      node("parser", "agent", "Query Parser", CX, Y(1), "", "Bot"),
      node("schema", "tool", "Schema Context", LX, Y(2), "", "Layers"),
      node("generator", "agent", "SQL Generator", CX, Y(2), "", "Bot"),
      node("validator", "agent", "Validation Layer", RX, Y(2), "", "Shield"),
      node("explainer", "agent", "Result Explainer", CX, Y(3), "", "Bot"),
      node("response", "service", "Formatted Response", CX, Y(4), "", "FileText"),
    ],
    ai_design_edges: [
      edge("e1", "user", "parser"),
      edge("e2", "parser", "schema", "Context"),
      edge("e3", "schema", "generator"),
      edge("e4", "parser", "generator", "Intent"),
      edge("e5", "generator", "validator", "SQL"),
      edge("e6", "validator", "explainer", "Approved"),
      edge("e7", "explainer", "response"),
    ],
    architecture_nodes: [
      node("user", "user", "Business User", CX, Y(0)),
      node("api", "service", "FastAPI", CX, Y(1), "", "Server"),
      node("registry", "database", "Schema Registry", LX, Y(2), "", "Database"),
      node("llm", "llm", "Azure OpenAI", RX, Y(2), "", "Sparkles"),
      node("validator", "service", "SQL Validator", CX, Y(2), "", "Shield"),
      node("connectors", "tool", "DB Connectors", LX, Y(3), "", "Database"),
      node("response", "service", "Formatted Response", CX, Y(4), "", "FileText"),
    ],
    architecture_edges: [
      edge("a1", "user", "api"),
      edge("a2", "api", "registry", "Schema"),
      edge("a3", "api", "llm", "Prompt"),
      edge("a4", "llm", "validator", "SQL draft"),
      edge("a5", "validator", "connectors", "Execute"),
      edge("a6", "connectors", "response", "Results"),
    ],
  },

  "notion-style-portfolio": {
    ai_design_nodes: [
      node("author", "user", "Author", CX, Y(0)),
      node("editor", "service", "Content Editor", CX, Y(1), "", "Code"),
      node("serializer", "service", "Block Serializer", LX, Y(2), "", "Layers"),
      node("store", "database", "Content Store", RX, Y(2), "", "Database"),
      node("renderer", "service", "Public Renderer", CX, Y(3), "", "Server"),
      node("reader", "user", "Reader", CX, Y(4)),
    ],
    ai_design_edges: [
      edge("e1", "author", "editor"),
      edge("e2", "editor", "serializer", "Blocks"),
      edge("e3", "serializer", "store", "Persist"),
      edge("e4", "store", "renderer", "Load"),
      edge("e5", "renderer", "reader", "Publish"),
    ],
    architecture_nodes: [
      node("admin", "user", "Admin", LX, Y(0)),
      node("panel", "service", "Admin Panel", LX, Y(1), "", "Server"),
      node("app", "service", "Next.js App Router", CX, Y(1), "", "Server"),
      node("db", "database", "Supabase PostgreSQL", RX, Y(1), "", "Database"),
      node("storage", "database", "Storage Bucket", RX, Y(2), "", "HardDrive"),
      node("public", "user", "Public Site", CX, Y(2)),
      node("renderer", "service", "RichContentRenderer", CX, Y(3), "", "Layers"),
    ],
    architecture_edges: [
      edge("a1", "admin", "panel"),
      edge("a2", "panel", "app", "Mutations"),
      edge("a3", "app", "db", "Read/write"),
      edge("a4", "app", "storage", "Assets"),
      edge("a5", "public", "app", "Request"),
      edge("a6", "app", "renderer", "Render"),
    ],
  },

  "genai-cybersecurity-assistant": {
    ai_design_nodes: [
      node("analyst", "user", "Security Analyst", CX, Y(0)),
      node("retrieval", "agent", "Retrieval Pipeline", CX, Y(1), "", "Search"),
      node("assembler", "tool", "Context Assembler", LX, Y(2), "", "Layers"),
      node("gemini", "llm", "Gemini Generator", RX, Y(2), "", "Sparkles"),
      node("validator", "agent", "Response Validator", CX, Y(3), "", "Shield"),
      node("triage", "service", "Triage Recommendation", CX, Y(4), "", "FileText"),
    ],
    ai_design_edges: [
      edge("e1", "analyst", "retrieval"),
      edge("e2", "retrieval", "assembler", "Candidates"),
      edge("e3", "assembler", "gemini", "Context"),
      edge("e4", "gemini", "validator", "Draft"),
      edge("e5", "validator", "triage", "Approved"),
      edge("e6", "triage", "analyst", "Guidance"),
    ],
    architecture_nodes: [
      node("analyst", "user", "Security Analyst", CX, Y(0)),
      node("api", "service", "FastAPI on SageMaker", CX, Y(1), "", "Server"),
      node("langchain", "service", "LangChain", CX, Y(2), "", "Workflow"),
      node("vector", "database", "Vector Store", LX, Y(3), "", "Database"),
      node("corpus", "database", "Scenario Corpus", RX, Y(3), "", "Database"),
      node("gemini", "llm", "Gemini API", CX, Y(4), "", "Sparkles"),
      node("audit", "database", "Audit Logger", CX, Y(5), "", "Database"),
    ],
    architecture_edges: [
      edge("a1", "analyst", "api"),
      edge("a2", "api", "langchain", "Orchestrate"),
      edge("a3", "langchain", "vector", "Search"),
      edge("a4", "langchain", "corpus", "Filter"),
      edge("a5", "langchain", "gemini", "Prompt"),
      edge("a6", "gemini", "api", "Response"),
      edge("a7", "api", "audit", "Log"),
    ],
  },
}
