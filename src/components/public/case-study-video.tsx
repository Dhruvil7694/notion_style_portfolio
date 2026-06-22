import { resolveVideoEmbed } from "@/lib/public/project-gallery"

type CaseStudyVideoProps = {
  url: string
  title: string
}

export function CaseStudyVideo({ url, title }: CaseStudyVideoProps) {
  const embed = resolveVideoEmbed(url)

  if (!embed) {
    return null
  }

  if (embed.kind === "file") {
    return (
      <div className="case-study-video">
        <video
          className="case-study-video-player"
          controls
          playsInline
          preload="metadata"
          src={embed.src}
        >
          <track kind="captions" />
        </video>
      </div>
    )
  }

  return (
    <div className="case-study-video">
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="case-study-video-embed"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src={embed.src}
        title={`${title} demo video`}
      />
    </div>
  )
}
