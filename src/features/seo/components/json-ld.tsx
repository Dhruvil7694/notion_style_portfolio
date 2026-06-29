type JsonLdPayload = Record<string, unknown>

type JsonLdProps = {
  data: JsonLdPayload | JsonLdPayload[]
}

function stripJsonLdContext(entry: JsonLdPayload): JsonLdPayload {
  const copy = { ...entry }
  delete copy["@context"]
  return copy
}

export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data)
    ? {
        "@context": "https://schema.org",
        "@graph": data.map(stripJsonLdContext),
      }
    : data

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
      type="application/ld+json"
    />
  )
}
