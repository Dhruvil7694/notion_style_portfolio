const IST_TIMEZONE = "Asia/Kolkata"

export function getISTHour(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: IST_TIMEZONE,
    }).format(now)
  )
}

export function getISTDay(now = new Date()): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: IST_TIMEZONE,
  }).format(now)

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  return map[weekday] ?? 0
}

export function getISTMinute(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      minute: "numeric",
      timeZone: IST_TIMEZONE,
    }).format(now)
  )
}

export function getISTSecond(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      second: "numeric",
      timeZone: IST_TIMEZONE,
    }).format(now)
  )
}

export function formatISTClock(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: IST_TIMEZONE,
  }).formatToParts(now)

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00"
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00"
  const second = parts.find((part) => part.type === "second")?.value ?? "00"
  const dayPeriod =
    parts.find((part) => part.type === "dayPeriod")?.value ?? "AM"

  return `${hour}:${minute}:${second} ${dayPeriod.toUpperCase()} IST`
}
