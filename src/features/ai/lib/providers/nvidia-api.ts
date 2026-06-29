import "server-only"

const NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1"

type NvidiaModelsResponse = {
  data?: Array<{ id?: string }>
  object?: string
}

export async function probeNvidiaApiKey(
  apiKey: string
): Promise<{ ok: boolean; error?: string; modelCount?: number }> {
  const trimmed = apiKey.trim()
  if (!trimmed) {
    return { ok: false, error: "API key is required" }
  }

  try {
    const response = await fetch(`${NVIDIA_API_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${trimmed}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: "Invalid NVIDIA API key" }
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      const detail = body ? `: ${body.slice(0, 160)}` : ""
      return {
        ok: false,
        error: `NVIDIA API error (${response.status})${detail}`,
      }
    }

    const payload = (await response.json()) as NvidiaModelsResponse
    const modelCount = payload.data?.length ?? 0

    if (modelCount === 0) {
      return { ok: false, error: "No models available for this NVIDIA API key" }
    }

    return { ok: true, modelCount }
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return { ok: false, error: "NVIDIA API request timed out" }
    }

    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "NVIDIA API request failed",
    }
  }
}
