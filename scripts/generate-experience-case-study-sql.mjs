import { writeFileSync } from "node:fs"

import { EXPERIENCE_CASE_STUDY_BY_COMPANY } from "./experience-case-study-data.mjs"

const lines = [
  "-- Experience case_study backfill (from experience-case-study-data.mjs)",
  "",
]

for (const [company, data] of Object.entries(
  EXPERIENCE_CASE_STUDY_BY_COMPANY
)) {
  const json = JSON.stringify(data).replace(/'/g, "''")
  const companySql = company.replace(/'/g, "''")
  lines.push(
    `UPDATE public.experience SET case_study = '${json}'::jsonb WHERE company = '${companySql}';`
  )
}

writeFileSync(
  "supabase/seeds/experience-case-study.sql",
  `${lines.join("\n")}\n`
)
console.log(
  `Wrote ${lines.length} lines to supabase/seeds/experience-case-study.sql`
)
