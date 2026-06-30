const NOTION_VERSION = "2022-06-28"
const API_BASE = "https://api.notion.com/v1"

export function getNotionConfig() {
  const token = process.env.NOTION_API_KEY
  if (!token) {
    throw new Error(
      "NOTION_API_KEY is required. Create an integration at https://www.notion.so/profile/integrations"
    )
  }

  return {
    token,
    techStackPageId: requireEnv("NOTION_TECH_STACK_PAGE_ID"),
    featuresPageId: requireEnv("NOTION_FEATURES_PAGE_ID"),
    schemaDatabaseId: requireEnv("NOTION_SCHEMA_DATABASE_ID"),
  }
}

function requireEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value.replace(/-/g, "")
}

async function notionRequest(token, path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Notion API ${path} failed (${response.status}): ${body}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function listBlockChildren(token, blockId) {
  const blocks = []
  let cursor

  do {
    const query = cursor ? `?start_cursor=${cursor}` : ""
    const data = await notionRequest(
      token,
      `/blocks/${blockId}/children${query}`
    )
    blocks.push(...(data.results ?? []))
    cursor = data.has_more ? data.next_cursor : undefined
    if (cursor) await sleep(150)
  } while (cursor)

  return blocks
}

export async function deleteBlock(token, blockId) {
  await notionRequest(token, `/blocks/${blockId}`, { method: "DELETE" })
  await sleep(120)
}

export async function clearPageContent(token, pageId) {
  const children = await listBlockChildren(token, pageId)
  for (const block of children) {
    await deleteBlock(token, block.id)
  }
}

export async function appendBlocks(token, blockId, blocks) {
  const chunkSize = 100
  for (let i = 0; i < blocks.length; i += chunkSize) {
    const chunk = blocks.slice(i, i + chunkSize)
    await notionRequest(token, `/blocks/${blockId}/children`, {
      method: "PATCH",
      body: JSON.stringify({ children: chunk }),
    })
    await sleep(200)
  }
}

export async function replacePageContent(token, pageId, blocks) {
  await clearPageContent(token, pageId)
  if (blocks.length > 0) {
    await appendBlocks(token, pageId, blocks)
  }
}

export async function queryDatabase(token, databaseId) {
  const pages = []
  let cursor

  do {
    const body = cursor ? { start_cursor: cursor } : {}
    const data = await notionRequest(token, `/databases/${databaseId}/query`, {
      method: "POST",
      body: JSON.stringify(body),
    })
    pages.push(...(data.results ?? []))
    cursor = data.has_more ? data.next_cursor : undefined
    if (cursor) await sleep(150)
  } while (cursor)

  return pages
}

export async function createDatabasePage(token, databaseId, properties) {
  return notionRequest(token, "/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  })
}

export async function updatePageProperties(token, pageId, properties) {
  return notionRequest(token, `/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties }),
  })
}

export async function listChildPages(token, pageId) {
  const blocks = await listBlockChildren(token, pageId)
  return blocks.filter((block) => block.type === "child_page")
}

export async function findOrCreateChildPage(token, parentPageId, title) {
  const children = await listChildPages(token, parentPageId)
  const existing = children.find(
    (block) => block.child_page?.title?.toLowerCase() === title.toLowerCase()
  )

  if (existing) {
    return existing.id
  }

  const page = await notionRequest(token, "/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { page_id: parentPageId },
      properties: {
        title: {
          title: [{ type: "text", text: { content: title } }],
        },
      },
    }),
  })

  return page.id
}
