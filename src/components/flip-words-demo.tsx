import { FlipWords } from "@/components/ui/flip-words"

const FLIP_KEYWORDS = [
  "RAG",
  "Agentic AI",
  "Automations",
  "NL-to-SQL",
  "Document Intelligence",
  "LLM Applications",
] as const

export default function FlipWordsDemo() {
  return (
    <p className="mx-auto max-w-lg py-10 text-left text-neutral-600 dark:text-neutral-400">
      I build production systems for{" "}
      <FlipWords className="font-medium text-neutral-900 dark:text-neutral-100" words={[...FLIP_KEYWORDS]} />
      {" "}
      — spanning architectures, interfaces, and pipelines built to deploy and operate in production.
    </p>
  )
}
