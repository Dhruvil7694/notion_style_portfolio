#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs"
import path from "node:path"
import process from "node:process"

function loadDotEnv() {
  const root = process.cwd()
  for (const file of [".env", ".env.local"]) {
    const filePath = path.join(root, file)
    if (!existsSync(filePath)) continue
    for (const line of readFileSync(filePath, "utf8").split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  }
}

loadDotEnv()

import {
  buildFeatureDetailBlocks,
  buildFeaturesIndexBlocks,
  buildTechStackBlocks,
} from "./blocks.mjs"
import { extractAll } from "./extract.mjs"
import {
  createDatabasePage,
  findOrCreateChildPage,
  getNotionConfig,
  queryDatabase,
  replacePageContent,
  updatePageProperties,
} from "./notion-api.mjs"

function notionTitle(value) {
  return { title: [{ type: "text", text: { content: value.slice(0, 2000) } }] }
}

function notionRichText(value) {
  return {
    rich_text: [
      { type: "text", text: { content: (value ?? "").slice(0, 2000) } },
    ],
  }
}

function notionSelect(value) {
  return value ? { select: { name: value } } : undefined
}

function notionCheckbox(nullable) {
  return { checkbox: nullable }
}

function schemaProperties(row) {
  const props = {
    Column: notionTitle(`${row.table}.${row.column}`),
    Table: notionSelect(row.table),
    "Data Type": notionRichText(row.dataType),
    Nullable: notionCheckbox(row.nullable),
    Default: notionRichText(row.defaultValue ?? ""),
    Constraints: notionRichText(row.constraints ?? ""),
    Relations: notionRichText(row.relations ?? ""),
    Description: notionRichText(row.description ?? ""),
  }

  return Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined)
  )
}

async function syncTechStack(token, pageId, data, syncedAt) {
  const blocks = buildTechStackBlocks({
    dependencies: data.pkg.dependencies,
    devDependencies: data.pkg.devDependencies,
    apiRoutes: data.apiRoutes,
    tree: data.tree,
    syncedAt,
  })

  await replacePageContent(token, pageId, blocks)
  console.log(`✓ Tech Stack page updated (${data.apiRoutes.length} API routes)`)
}

async function syncFeaturesIndex(token, pageId, features, syncedAt) {
  const blocks = buildFeaturesIndexBlocks({ features, syncedAt })
  await replacePageContent(token, pageId, blocks)
  console.log(`✓ Features index updated (${features.length} modules)`)
}

async function syncFeatureSubpages(token, parentPageId, features, syncedAt) {
  for (const feature of features) {
    const pageId = await findOrCreateChildPage(
      token,
      parentPageId,
      feature.name
    )
    const blocks = buildFeatureDetailBlocks({ feature, syncedAt })
    await replacePageContent(token, pageId, blocks)
    console.log(`  ✓ feature/${feature.name}`)
  }
}

async function syncSchemaDatabase(token, databaseId, schemaRows) {
  const existingPages = await queryDatabase(token, databaseId)
  const byColumn = new Map()

  for (const page of existingPages) {
    const title = page.properties?.Column?.title?.[0]?.plain_text
    if (title) byColumn.set(title, page.id)
  }

  let created = 0
  let updated = 0
  const failures = []

  for (const row of schemaRows) {
    const key = `${row.table}.${row.column}`
    const properties = schemaProperties(row)
    const existingId = byColumn.get(key)

    try {
      if (existingId) {
        await updatePageProperties(token, existingId, properties)
        updated++
      } else {
        const page = await createDatabasePage(token, databaseId, properties)
        byColumn.set(key, page.id)
        created++
      }
    } catch (error) {
      failures.push({ key, message: error.message })
    }
  }

  console.log(
    `✓ Database Schema synced (${created} created, ${updated} updated, ${failures.length} failed, ${schemaRows.length} total)`
  )
  if (failures.length > 0) {
    console.warn("Schema sync failures (first 5):")
    for (const failure of failures.slice(0, 5)) {
      console.warn(`  - ${failure.key}: ${failure.message}`)
    }
    if (failures.length > 5) {
      console.warn(`  ... and ${failures.length - 5} more`)
    }
  }

  return failures.length
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")

  console.log("Extracting codebase metadata...")
  const data = await extractAll()

  console.log(
    `Found ${data.features.length} features, ${data.apiRoutes.length} API routes, ${data.schema.length} schema columns`
  )

  if (dryRun) {
    console.log("\nDry run — no Notion writes performed.")
    console.log(
      "Sample API routes:",
      data.apiRoutes
        .slice(0, 5)
        .map((route) => route.path)
        .join(", ")
    )
    return
  }

  const schemaOnly = process.argv.includes("--schema-only")
  const config = getNotionConfig()

  console.log("\nSyncing to Notion...")
  const syncedAt = new Date().toISOString()

  if (!schemaOnly) {
    await syncTechStack(config.token, config.techStackPageId, data, syncedAt)
    await syncFeaturesIndex(
      config.token,
      config.featuresPageId,
      data.features,
      syncedAt
    )
    await syncFeatureSubpages(
      config.token,
      config.featuresPageId,
      data.features,
      syncedAt
    )
  }

  const schemaFailures = await syncSchemaDatabase(
    config.token,
    config.schemaDatabaseId,
    data.schema
  )

  console.log("\nNotion dev docs sync complete.")
  if (schemaFailures > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error("Notion sync failed:", error.message)
  process.exit(1)
})
