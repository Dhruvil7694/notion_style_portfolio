import Link from "next/link"

type TechnologyHubMetaProps = {
  category?: string | null
  websiteUrl?: string | null
  documentationUrl?: string | null
  registered?: boolean
}

export function TechnologyHubMeta({
  category,
  websiteUrl,
  documentationUrl,
  registered,
}: TechnologyHubMetaProps) {
  if (!category && !websiteUrl && !documentationUrl && !registered) {
    return null
  }

  return (
    <dl className="technology-hub-meta">
      {category ? (
        <div className="technology-hub-meta-item">
          <dt className="technology-hub-meta-label">Category</dt>
          <dd className="technology-hub-meta-value">{category}</dd>
        </div>
      ) : null}
      {websiteUrl ? (
        <div className="technology-hub-meta-item">
          <dt className="technology-hub-meta-label">Website</dt>
          <dd className="technology-hub-meta-value">
            <Link href={websiteUrl} rel="noopener noreferrer" target="_blank">
              {websiteUrl.replace(/^https?:\/\//, "")}
            </Link>
          </dd>
        </div>
      ) : null}
      {documentationUrl ? (
        <div className="technology-hub-meta-item">
          <dt className="technology-hub-meta-label">Documentation</dt>
          <dd className="technology-hub-meta-value">
            <Link href={documentationUrl} rel="noopener noreferrer" target="_blank">
              {documentationUrl.replace(/^https?:\/\//, "")}
            </Link>
          </dd>
        </div>
      ) : null}
      {registered ? (
        <div className="technology-hub-meta-item">
          <dt className="technology-hub-meta-label">Registry</dt>
          <dd className="technology-hub-meta-value">Knowledge hub</dd>
        </div>
      ) : null}
    </dl>
  )
}
