import type { CheckResult } from "./checks"

export function checkEnvVar(name: string): CheckResult {
  const value = process.env[name]
  if (!value) {
    return {
      id: `env_${name.toLowerCase()}`,
      label: name,
      status: "critical",
      message: `${name} is not set`,
      detail: `Add ${name} to your environment variables`,
    }
  }
  return {
    id: `env_${name.toLowerCase()}`,
    label: name,
    status: "healthy",
    message: `${name} is configured`,
  }
}

export function checkUrl(url: string | undefined, label: string): CheckResult {
  const id = `url_${label.toLowerCase().replace(/\s+/g, "_")}`
  if (!url) {
    return {
      id,
      label,
      status: "critical",
      message: `${label} URL is not set`,
    }
  }
  if (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("0.0.0.0")
  ) {
    return {
      id,
      label,
      status: "warning",
      message: `${label} is pointing to localhost`,
      detail: `Current value: ${url}. Update to production URL before deploying.`,
    }
  }
  return {
    id,
    label,
    status: "healthy",
    message: `${label} is set to a non-localhost URL`,
  }
}
