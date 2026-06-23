import { AnalyticsProvider } from "@/components/public/analytics-provider"
import { AssistantShell } from "@/components/public/chat/assistant-shell"
import { DiscoveryShell } from "@/components/public/discovery-shell"
import { FloatingDock } from "@/components/public/floating-dock"
import { ScrollProgress } from "@/components/public/scroll-progress"
import { SiteFooter } from "@/components/public/site-footer"
import { SiteHeader } from "@/components/public/site-header"
import { SiteThemeProvider } from "@/components/public/site-theme-provider"
import { SmoothScrollProvider } from "@/components/public/smooth-scroll-provider"
import { ThankYouDivider } from "@/components/public/thank-you-divider"
import { featureFlags } from "@/config/feature-flags"
import { getActiveResume, getPublicSettings } from "@/lib/public/queries"

type PublicLayoutProps = {
  children: React.ReactNode
}

export async function PublicLayout({ children }: PublicLayoutProps) {
  const [settings, resume] = await Promise.all([
    getPublicSettings(),
    getActiveResume(),
  ])

  return (
    <SiteThemeProvider>
      <AnalyticsProvider>
        <SmoothScrollProvider>
          <DiscoveryShell>
            <AssistantShell>
              <div className="public-site flex min-h-full flex-col">
                <ScrollProgress />
                <FloatingDock
                  resumeAvailable={Boolean(resume?.file_path)}
                  settings={settings}
                />
                <SiteHeader
                  assistantEnabled={featureFlags.enablePortfolioAssistant}
                  settings={settings}
                />
                <main className="dock-main flex-1">{children}</main>
                <ThankYouDivider />
                <SiteFooter
                  resumeAvailable={Boolean(resume?.file_path)}
                  settings={settings}
                />
              </div>
            </AssistantShell>
          </DiscoveryShell>
        </SmoothScrollProvider>
      </AnalyticsProvider>
    </SiteThemeProvider>
  )
}
