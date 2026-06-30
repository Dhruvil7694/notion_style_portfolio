function richText(content) {
  return [{ type: "text", text: { content: content.slice(0, 2000) } }]
}

export function heading(level, text) {
  const type = `heading_${Math.min(level, 3)}`
  return { object: "block", type, [type]: { rich_text: richText(text) } }
}

export function paragraph(text) {
  return {
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: richText(text) },
  }
}

export function bulletedItem(text) {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: richText(text) },
  }
}

export function codeBlock(language, code) {
  return {
    object: "block",
    type: "code",
    code: {
      rich_text: richText(code.slice(0, 2000)),
      language,
    },
  }
}

export function divider() {
  return { object: "block", type: "divider", divider: {} }
}

export function callout(text, emoji = "🔄") {
  return {
    object: "block",
    type: "callout",
    callout: {
      rich_text: richText(text),
      icon: { type: "emoji", emoji },
    },
  }
}

export function buildTechStackBlocks({
  dependencies,
  devDependencies,
  apiRoutes,
  tree,
  syncedAt,
}) {
  const blocks = [
    callout(`Auto-synced from codebase on ${syncedAt}`, "⚙️"),
    heading(2, "Core Dependencies"),
    ...Object.entries(dependencies).map(([name, version]) =>
      bulletedItem(`${name} — ${version}`)
    ),
    heading(2, "Dev Dependencies"),
    ...Object.entries(devDependencies).map(([name, version]) =>
      bulletedItem(`${name} — ${version}`)
    ),
    divider(),
    heading(2, "API Routes"),
    ...apiRoutes.map((route) =>
      bulletedItem(`${route.methods.join(", ")} ${route.path}`)
    ),
    divider(),
    heading(2, "Codebase Tree"),
    codeBlock("plain text", tree),
  ]

  return blocks
}

export function buildFeaturesIndexBlocks({ features, syncedAt }) {
  return [
    callout(`Auto-synced from src/features/ on ${syncedAt}`, "🧩"),
    heading(2, "Feature Modules"),
    paragraph(`${features.length} modules detected under src/features/.`),
    ...features.map((feature) =>
      bulletedItem(
        `${feature.name} — ${feature.apiRoutes.length > 0 ? feature.apiRoutes.join(", ") : "no REST API"} (${feature.fileCount} files)`
      )
    ),
  ]
}

export function buildFeatureDetailBlocks({ feature, syncedAt }) {
  const blocks = [
    callout(`Auto-synced on ${syncedAt}`, "📦"),
    heading(2, "What It Brings"),
    paragraph(feature.description),
    heading(2, "Module Stats"),
    bulletedItem(`Source files: ${feature.fileCount}`),
    bulletedItem(`Subdirectories: ${feature.subdirs.join(", ") || "none"}`),
    heading(2, "APIs"),
  ]

  if (feature.apiRoutes.length === 0) {
    blocks.push(
      paragraph(
        "No dedicated REST route handlers. Uses Server Components and/or Server Actions."
      )
    )
  } else {
    blocks.push(...feature.apiRoutes.map((route) => bulletedItem(route)))
  }

  return blocks
}
