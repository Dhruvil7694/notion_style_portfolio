/**
 * Assistant load test — run with:
 *   npx tsx scripts/load-test-assistant.ts [base-url]
 *
 * Default base URL: http://localhost:3000
 * Override: npx tsx scripts/load-test-assistant.ts https://your-preview.vercel.app
 */

const BASE_URL = process.argv[2] ?? "http://localhost:3000"
const API_URL = `${BASE_URL}/api/chat`

const TEST_MESSAGES = [
  "What projects use LangGraph?",
  "What RAG systems has Dhruvil built?",
  "What technologies does he specialize in?",
  "What research has he done?",
  "Tell me about his AI engineering experience.",
  "What is his most complex project?",
  "Explain his knowledge graph architecture.",
  "What NLP work has he done?",
  "What automation systems has he built?",
  "What is his approach to system design?",
]

type RequestResult = {
  durationMs: number
  success: boolean
  statusCode: number
  error?: string
  failover?: boolean
}

async function sendMessage(
  message: string,
  index: number
): Promise<RequestResult> {
  const start = Date.now()
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: message }] }),
      signal: AbortSignal.timeout(30_000),
    })

    const durationMs = Date.now() - start

    if (!res.ok) {
      return { durationMs, success: false, statusCode: res.status }
    }

    // Drain the stream
    const reader = res.body?.getReader()
    if (reader) {
      while (true) {
        const { done } = await reader.read()
        if (done) break
      }
    }

    const totalDuration = Date.now() - start
    void index
    return { durationMs: totalDuration, success: true, statusCode: res.status }
  } catch (err) {
    return {
      durationMs: Date.now() - start,
      success: false,
      statusCode: 0,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

function percentile(sorted: number[], p: number): number {
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)] ?? 0
}

function printReport(label: string, results: RequestResult[]): void {
  const durations = results.map((r) => r.durationMs).sort((a, b) => a - b)
  const failures = results.filter((r) => !r.success)
  const failureRate = (failures.length / results.length) * 100

  console.log(`\n${"─".repeat(50)}`)
  console.log(`  ${label}`)
  console.log(`${"─".repeat(50)}`)
  console.log(`  Total requests:  ${results.length}`)
  console.log(`  Success:         ${results.length - failures.length}`)
  console.log(
    `  Failures:        ${failures.length} (${failureRate.toFixed(1)}%)`
  )
  console.log(`  P50 latency:     ${percentile(durations, 50)}ms`)
  console.log(`  P95 latency:     ${percentile(durations, 95)}ms`)
  console.log(`  P99 latency:     ${percentile(durations, 99)}ms`)
  console.log(`  Max latency:     ${Math.max(...durations)}ms`)
  console.log(`  Min latency:     ${Math.min(...durations)}ms`)

  if (failures.length > 0) {
    console.log(`\n  Failure breakdown:`)
    const byStatus = new Map<string, number>()
    for (const f of failures) {
      const key =
        f.statusCode === 0
          ? `timeout/error: ${f.error ?? "unknown"}`
          : `HTTP ${f.statusCode}`
      byStatus.set(key, (byStatus.get(key) ?? 0) + 1)
    }
    for (const [key, count] of byStatus) {
      console.log(`    ${key}: ${count}`)
    }
  }
}

async function runScenario(concurrency: number): Promise<RequestResult[]> {
  const messages = Array.from(
    { length: concurrency },
    (_, i) => TEST_MESSAGES[i % TEST_MESSAGES.length] as string
  )
  return Promise.all(messages.map((msg, i) => sendMessage(msg, i)))
}

async function main() {
  console.log(`\nAssistant Load Test`)
  console.log(`Target: ${API_URL}`)
  console.log(`Started: ${new Date().toISOString()}`)

  // Warm up
  console.log(`\nWarming up (1 request)…`)
  const warmup = await sendMessage("Hello", 0)
  if (!warmup.success) {
    console.error(
      `\n✗ Warm-up failed (${warmup.statusCode} ${warmup.error ?? ""})`
    )
    console.error(`  Ensure the dev server is running: npm run dev`)
    process.exit(1)
  }
  console.log(`  OK (${warmup.durationMs}ms)`)

  const scenarios: Array<{ concurrency: number; label: string }> = [
    { concurrency: 10, label: "10 concurrent requests" },
    { concurrency: 25, label: "25 concurrent requests" },
    { concurrency: 50, label: "50 concurrent requests" },
  ]

  const allResults: { label: string; results: RequestResult[] }[] = []

  for (const { concurrency, label } of scenarios) {
    console.log(`\nRunning: ${label}…`)
    const batchStart = Date.now()
    const results = await runScenario(concurrency)
    const batchMs = Date.now() - batchStart
    console.log(`  Completed in ${batchMs}ms`)
    allResults.push({ label, results })
    // small gap between scenarios to avoid cascading rate limits
    await new Promise((r) => setTimeout(r, 2000))
  }

  console.log(`\n${"═".repeat(50)}`)
  console.log(`  LOAD TEST REPORT`)
  console.log(`${"═".repeat(50)}`)

  for (const { label, results } of allResults) {
    printReport(label, results)
  }

  // Overall pass/fail
  const allRequests = allResults.flatMap((r) => r.results)
  const totalFailures = allRequests.filter((r) => !r.success).length
  const overallFailureRate = (totalFailures / allRequests.length) * 100
  const p95Overall = percentile(
    allRequests.map((r) => r.durationMs).sort((a, b) => a - b),
    95
  )

  console.log(`\n${"═".repeat(50)}`)
  console.log(`  VERDICT`)
  console.log(`${"═".repeat(50)}`)
  console.log(`  Overall failure rate: ${overallFailureRate.toFixed(1)}%`)
  console.log(`  Overall P95 latency:  ${p95Overall}ms`)

  const pass = overallFailureRate < 5 && p95Overall < 15_000
  console.log(
    `\n  ${pass ? "✓ PASS" : "✗ FAIL"} — ${pass ? "Ready for production load" : "Investigate before launch"}`
  )
  console.log(`\nFinished: ${new Date().toISOString()}\n`)

  process.exit(pass ? 0 : 1)
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
