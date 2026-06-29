import { AssistantShell } from "@/features/ai-assistant/components/assistant-shell"
import { ThankYouDivider } from "@/features/contact/components/thank-you-divider"
import { DiscoveryShell } from "@/features/discovery/components/discovery-shell"
import {
  getActiveResume,
  getPublicSettings,
} from "@/features/portfolio/lib/queries"
import { AnalyticsProvider } from "@/features/site-shell/components/analytics-provider"
import { ClickRippleProvider } from "@/features/site-shell/components/click-ripple-provider"
import { ErrorBoundary } from "@/features/site-shell/components/error-boundary"
import { FloatingDock } from "@/features/site-shell/components/floating-dock"
import { ScrollProgress } from "@/features/site-shell/components/scroll-progress"
import { SiteFooter } from "@/features/site-shell/components/site-footer"
import { SiteHeader } from "@/features/site-shell/components/site-header"
import { SiteThemeProvider } from "@/features/site-shell/components/site-theme-provider"
import { SmoothScrollProvider } from "@/features/site-shell/components/smooth-scroll-provider"
import { featureFlags } from "@/shared/config/feature-flags"

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
        <ClickRippleProvider>
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
                  <main className="dock-main flex-1">
                    <ErrorBoundary>{children}</ErrorBoundary>
                  </main>
                  <ThankYouDivider />
                  <SiteFooter
                    resumeAvailable={Boolean(resume?.file_path)}
                    settings={settings}
                  />
                </div>
              </AssistantShell>
            </DiscoveryShell>
          </SmoothScrollProvider>
        </ClickRippleProvider>
      </AnalyticsProvider>
    </SiteThemeProvider>
  )
}
