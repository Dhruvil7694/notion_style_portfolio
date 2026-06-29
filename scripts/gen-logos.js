const si = require("simple-icons")
const fs = require("fs")
const path = require("path")

const dir = path.join(__dirname, "..", "public", "logos")
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

// PostHog — brand orange
const ph = si.siPosthog.path
fs.writeFileSync(
  path.join(dir, "posthog.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#F54E00" d="${ph}"/></svg>`
)

// Sentry — brand purple
const se = si.siSentry.path
fs.writeFileSync(
  path.join(dir, "sentry.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#362D59" d="${se}"/></svg>`
)

console.log("logos written to public/logos/")
