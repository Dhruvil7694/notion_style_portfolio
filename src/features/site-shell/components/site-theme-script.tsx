import {
  SITE_THEME_DEFAULT,
  SITE_THEME_STORAGE_KEY,
} from "@/features/portfolio/lib/site-theme"

export function SiteThemeScript() {
  const script = `(function(){try{var k=${JSON.stringify(SITE_THEME_STORAGE_KEY)};var d=${JSON.stringify(SITE_THEME_DEFAULT)};var t=localStorage.getItem(k);document.documentElement.dataset.siteTheme=t==="light"||t==="dark"?t:d}catch(e){document.documentElement.dataset.siteTheme=${JSON.stringify(SITE_THEME_DEFAULT)}}})();`

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
