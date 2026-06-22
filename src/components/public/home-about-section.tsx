import Link from "next/link"

import { KbSection } from "@/components/public/kb-section"
import type { AboutContent } from "@/lib/public/about-content"
import type { SiteSettings } from "@/lib/public/settings"

type HomeAboutSectionProps = {
  about: AboutContent
  focusAreas: SiteSettings["focus_areas"]
}

export function HomeAboutSection({ about, focusAreas }: HomeAboutSectionProps) {
  const areas = focusAreas.filter((area) => area.trim())

  return (
    <KbSection className="home-about-section" title="About">
      <div className="home-about-body">
        <h3 className="home-about-subtitle">Who I Am</h3>
        <div className="home-about-copy">
          {about.intro ? <p>{about.intro}</p> : null}
          {about.career_intro ? <p>{about.career_intro}</p> : null}
        </div>

        {areas.length > 0 ? (
          <div className="home-about-focus">
            <h3 className="home-about-subtitle">Focus Areas</h3>
            <p className="home-about-focus-list">{areas.join(" · ")}</p>
          </div>
        ) : null}

        <Link className="home-about-more" href="/about">
          More about me
        </Link>
      </div>
    </KbSection>
  )
}
