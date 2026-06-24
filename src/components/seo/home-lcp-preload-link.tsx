import type { StaticImageData } from "next/image"

import { buildProfileAvatarPreloadHref } from "@/lib/images/next-image"

type HomeLcpPreloadLinkProps = {
  avatarSrc: string | StaticImageData
}

export function HomeLcpPreloadLink({ avatarSrc }: HomeLcpPreloadLinkProps) {
  const href = buildProfileAvatarPreloadHref(avatarSrc)

  if (!href) {
    return null
  }

  return <link as="image" fetchPriority="high" href={href} rel="preload" />
}
