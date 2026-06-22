import { skillMatchesTech } from "../src/lib/public/skill-usage"
import { buildSkillDetailRows, buildStackShowcaseGroups } from "../src/lib/public/stack-registry"
import type { Project, Skill } from "../src/types/database.helpers"

const projects: Pick<Project, "id" | "slug" | "title" | "tech_stack">[] = [
  {
    id: "1",
    slug: "bohrai-research-platform",
    title: "BohrAI",
    tech_stack: ["Python", "FastAPI", "LangGraph", "LangChain", "SSE", "Multi-Agent Systems"],
  },
  {
    id: "2",
    slug: "enterprise-file-governance",
    title: "Enterprise File Governance",
    tech_stack: ["FastAPI", "PostgreSQL", "Redis", "LLM Tool-Calling", "SSE", "RBAC"],
  },
  {
    id: "3",
    slug: "nl-to-sql-platform",
    title: "NL-to-SQL",
    tech_stack: ["Python", "LLM", "PostgreSQL", "MySQL", "MSSQL", "Azure OpenAI"],
  },
  {
    id: "4",
    slug: "notion-style-portfolio",
    title: "Notion Portfolio",
    tech_stack: ["Next.js", "Supabase", "TypeScript", "Tailwind CSS", "Tiptap"],
  },
  {
    id: "5",
    slug: "genai-cybersecurity-assistant",
    title: "GenAI Cyber",
    tech_stack: ["Python", "LangChain", "RAG", "Gemini API", "FastAPI"],
  },
]

const skillDefaults = {
  show_on_landing: true,
  created_at: "",
} as const

const skills: Skill[] = [
  { id: "s1", category: "ai_ml", name: "Multi-Agent Systems", proficiency: "proficient", display_order: 1, ...skillDefaults },
  { id: "s2", category: "ai_ml", name: "RAG Pipelines", proficiency: "expert", display_order: 2, ...skillDefaults },
  { id: "s3", category: "ai_ml", name: "LangGraph", proficiency: "proficient", display_order: 3, ...skillDefaults },
  { id: "s4", category: "ai_ml", name: "LangChain", proficiency: "proficient", display_order: 4, ...skillDefaults },
  { id: "s5", category: "ai_ml", name: "OpenAI API", proficiency: "expert", display_order: 5, ...skillDefaults },
  { id: "s6", category: "ai_ml", name: "Azure OpenAI Service", proficiency: "proficient", display_order: 6, ...skillDefaults },
  { id: "s7", category: "ai_ml", name: "Azure AI Search", proficiency: "proficient", display_order: 7, ...skillDefaults },
  { id: "s8", category: "ai_ml", name: "Prompt Engineering", proficiency: "expert", display_order: 8, ...skillDefaults },
  { id: "s9", category: "ai_ml", name: "LLM Evaluation", proficiency: "proficient", display_order: 9, ...skillDefaults },
  { id: "s10", category: "language", name: "Python", proficiency: "expert", display_order: 10, ...skillDefaults },
  { id: "s11", category: "framework", name: "FastAPI", proficiency: "proficient", display_order: 11, ...skillDefaults },
  { id: "s12", category: "framework", name: "Next.js", proficiency: "proficient", display_order: 12, ...skillDefaults },
  { id: "s13", category: "framework", name: "React", proficiency: "proficient", display_order: 13, ...skillDefaults },
  { id: "s14", category: "language", name: "TypeScript", proficiency: "proficient", display_order: 14, ...skillDefaults },
  { id: "s15", category: "cloud", name: "Azure", proficiency: "proficient", display_order: 15, ...skillDefaults },
  { id: "s16", category: "cloud", name: "AWS SageMaker", proficiency: "proficient", display_order: 16, ...skillDefaults },
  { id: "s17", category: "cloud", name: "Supabase", proficiency: "proficient", display_order: 17, ...skillDefaults },
  { id: "s18", category: "tool", name: "Docker", proficiency: "proficient", display_order: 18, ...skillDefaults },
  { id: "s19", category: "tool", name: "PostgreSQL", proficiency: "proficient", display_order: 19, ...skillDefaults },
  { id: "s20", category: "tool", name: "FAISS", proficiency: "proficient", display_order: 20, ...skillDefaults },
  { id: "s21", category: "tool", name: "Qdrant", proficiency: "proficient", display_order: 21, ...skillDefaults },
  { id: "s22", category: "tool", name: "MLflow", proficiency: "learning", display_order: 22, ...skillDefaults },
  { id: "s23", category: "tool", name: "GitHub Actions", proficiency: "proficient", display_order: 23, ...skillDefaults },
  { id: "s24", category: "ai_ml", name: "Transformers (Hugging Face)", proficiency: "proficient", display_order: 24, ...skillDefaults },
  { id: "s25", category: "ai_ml", name: "LoRA/QLoRA Fine-tuning", proficiency: "proficient", display_order: 25, ...skillDefaults },
  { id: "s26", category: "ai_ml", name: "TensorFlow", proficiency: "proficient", display_order: 26, ...skillDefaults },
]

console.log("=== STACK TECH -> PROJECT MATCHES ===\n")
const rows = buildSkillDetailRows(skills, projects, [])
for (const row of rows) {
  const slugs = row.projects.map((p) => p.slug).join(", ") || "(none)"
  console.log(`${row.name} -> ${slugs}`)
}

console.log("\n=== LANDING SHOWCASE CHIP -> PROJECT MATCHES ===\n")
const groups = buildStackShowcaseGroups({ projects, experience: [] }, skills)
for (const group of groups) {
  console.log(`[${group.category}]`)
  for (const item of group.items) {
    const slugs = item.projects.map((p) => p.slug).join(", ") || "(none)"
    console.log(`  ${item.label} -> ${slugs}`)
  }
  console.log()
}

console.log("=== TECH STACK COVERAGE (exact normalized match only) ===\n")
const allTech = [...new Set(projects.flatMap((p) => p.tech_stack ?? []))]
for (const tech of allTech.sort()) {
  const matchingSkills = skills
    .filter((skill) => skillMatchesTech(skill.name, tech))
    .map((skill) => skill.name)
  console.log(`${tech} -> ${matchingSkills.join(", ") || "(no skill metadata matched)"}`)
}
