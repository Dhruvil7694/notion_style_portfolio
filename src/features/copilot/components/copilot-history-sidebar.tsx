"use client"

import {
  Archive,
  Check,
  ChevronDown,
  FolderInput,
  MoreHorizontal,
  PenLine,
  Pin,
  SlidersHorizontal,
  Trash2,
} from "lucide-react"
import { type ReactNode, useMemo, useState } from "react"

import {
  type ChatSessionListItem,
  COPILOT_PROJECTS,
  getAllSessionPreferences,
  type GroupByOption,
  groupSessions,
  isSessionArchived,
  type SessionPreferences,
  splitSessionsBySection,
  updateSessionPreferences,
} from "@/features/copilot/lib/session-preferences"
import { cn } from "@/shared/lib/utils"
import { AnimatedList } from "@/shared/ui/animated-list"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

type CopilotHistorySidebarProps = {
  open: boolean
  sessions: ChatSessionListItem[]
  activeSessionId: string | null
  groupBy: GroupByOption
  preferencesVersion: number
  onGroupByChange: (value: GroupByOption) => void
  onSelectSession: (sessionId: string) => void
  onRenameSession: (sessionId: string, title: string) => Promise<void>
  onDeleteSession: (sessionId: string) => Promise<void>
  onPreferencesChange: () => void
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60_000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

function SessionRow({
  session,
  active,
  preferences,
  onSelect,
  onRename,
  onDelete,
  onPreferencesChange,
}: {
  session: ChatSessionListItem
  active: boolean
  preferences: SessionPreferences
  onSelect: () => void
  onRename: (title: string) => Promise<void>
  onDelete: () => Promise<void>
  onPreferencesChange: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(session.title)
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleRenameSubmit() {
    const title = renameValue.trim()
    if (!title) return
    await onRename(title)
    setRenameOpen(false)
  }

  function togglePin() {
    updateSessionPreferences(session.id, { pinned: !preferences.pinned })
    onPreferencesChange()
  }

  function toggleArchive() {
    const archived = !isSessionArchived(preferences)
    updateSessionPreferences(session.id, {
      archived,
      status: archived ? "archived" : "active",
    })
    onPreferencesChange()
  }

  function setProject(project: string) {
    updateSessionPreferences(session.id, { project })
    onPreferencesChange()
  }

  return (
    <>
      <figure
        className={cn(
          "relative w-full min-h-fit cursor-pointer overflow-hidden rounded-2xl px-3 py-2.5",
          "transition-all duration-200 ease-in-out hover:scale-[1.02] hover:bg-muted/60",
          active && "bg-muted/80"
        )}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 overflow-hidden">
            <figcaption className="flex items-center gap-1.5 text-sm font-medium">
              <button
                className="truncate text-left"
                onClick={onSelect}
                type="button"
              >
                {session.title}
              </button>
              {preferences.pinned ? (
                <Pin
                  aria-hidden
                  className="text-muted-foreground size-3 shrink-0"
                />
              ) : null}
            </figcaption>
            <p className="text-muted-foreground truncate text-xs">
              {formatRelativeTime(session.updated_at)}
              {preferences.project ? ` · ${preferences.project}` : ""}
              {preferences.unread ? " · Unread" : ""}
            </p>
          </div>

          {(hovered || menuOpen || active) && (
            <DropdownMenu onOpenChange={setMenuOpen} open={menuOpen}>
              <DropdownMenuTrigger
                render={
                  <Button
                    aria-label={`Options for ${session.title}`}
                    className="size-7 shrink-0 opacity-80 hover:opacity-100"
                    onClick={(event) => event.stopPropagation()}
                    size="icon"
                    type="button"
                    variant="ghost"
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem onClick={togglePin}>
                  <Pin />
                  {preferences.pinned ? "Unpin" : "Pin"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setRenameValue(session.title)
                    setRenameOpen(true)
                    setMenuOpen(false)
                  }}
                >
                  <PenLine />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderInput />
                    Add to project
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {COPILOT_PROJECTS.map((project) => (
                      <DropdownMenuItem
                        key={project}
                        onClick={() => setProject(project)}
                      >
                        {project}
                        {preferences.project === project ? (
                          <Check className="ml-auto size-4" />
                        ) : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleArchive}>
                  <Archive />
                  {isSessionArchived(preferences) ? "Unarchive" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void onDelete()}
                  variant="destructive"
                >
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </figure>

      <Dialog onOpenChange={setRenameOpen} open={renameOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`rename-${session.id}`}>Title</Label>
            <Input
              id={`rename-${session.id}`}
              onChange={(event) => setRenameValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  void handleRenameSubmit()
                }
              }}
              value={renameValue}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => setRenameOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={() => void handleRenameSubmit()} type="button">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CollapsibleSection({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string
  count: number
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="mb-3">
      <button
        className="flex w-full items-center gap-1 px-2 py-1.5 text-sm font-medium"
        onClick={onToggle}
        type="button"
      >
        {title}
        <span className="text-muted-foreground text-xs font-normal">
          ({count})
        </span>
        <ChevronDown
          className={cn("size-4 transition-transform", !open && "-rotate-90")}
        />
      </button>
      {open ? <div className="mt-0.5">{children}</div> : null}
    </section>
  )
}

function SessionList({
  sessions,
  groupBy,
  preferences,
  activeSessionId,
  onDeleteSession,
  onPreferencesChange,
  onRenameSession,
  onSelectSession,
}: {
  sessions: ChatSessionListItem[]
  groupBy: GroupByOption
  preferences: Record<string, SessionPreferences>
  activeSessionId: string | null
  onDeleteSession: (sessionId: string) => Promise<void>
  onPreferencesChange: () => void
  onRenameSession: (sessionId: string, title: string) => Promise<void>
  onSelectSession: (sessionId: string) => void
}) {
  const effectiveGroupBy = groupBy === "status" ? "none" : groupBy
  const groups = useMemo(
    () => groupSessions(sessions, preferences, effectiveGroupBy),
    [sessions, preferences, effectiveGroupBy]
  )

  if (sessions.length === 0) {
    return (
      <p className="text-muted-foreground px-2 py-1.5 text-xs">
        No conversations
      </p>
    )
  }

  return (
    <>
      {groups.map((group) => (
        <div key={group.label} className="mb-2 last:mb-0">
          {effectiveGroupBy !== "none" ? (
            <p className="text-muted-foreground px-2 py-1 text-xs font-medium">
              {group.label}
            </p>
          ) : null}
          <AnimatedList className="gap-1" delay={100} mode="sequential">
            {group.sessions.map((session) => (
              <SessionRow
                key={session.id}
                active={activeSessionId === session.id}
                onDelete={() => onDeleteSession(session.id)}
                onPreferencesChange={onPreferencesChange}
                onRename={(title) => onRenameSession(session.id, title)}
                onSelect={() => onSelectSession(session.id)}
                preferences={preferences[session.id] ?? {}}
                session={session}
              />
            ))}
          </AnimatedList>
        </div>
      ))}
    </>
  )
}

export function CopilotHistorySidebar({
  open,
  sessions,
  activeSessionId,
  groupBy,
  preferencesVersion,
  onGroupByChange,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
  onPreferencesChange,
}: CopilotHistorySidebarProps) {
  const [pinnedOpen, setPinnedOpen] = useState(true)
  const [recentsOpen, setRecentsOpen] = useState(true)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const preferences = useMemo(
    () => getAllSessionPreferences(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preferencesVersion]
  )

  const { pinned, recents, archived } = useMemo(
    () => splitSessionsBySection(sessions, preferences),
    [sessions, preferences]
  )

  const totalCount = sessions.length

  return (
    <aside
      className={cn(
        "bg-muted/25 z-20 flex w-72 shrink-0 flex-col transition-transform duration-200",
        "absolute inset-y-0 left-0 md:relative",
        open
          ? "translate-x-0 border-r-2 border-border shadow-[1px_0_0_0_color-mix(in_srgb,var(--border)_80%,transparent)]"
          : "-translate-x-full border-r-0 md:w-0 md:overflow-hidden md:border-r-0 md:shadow-none"
      )}
    >
      <div className="border-border flex items-center justify-between border-b bg-background/50 px-3 py-3">
        <span className="text-sm font-medium">Chats</span>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-xs">View all</span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  aria-label="Group chats"
                  className="size-8"
                  size="icon"
                  type="button"
                  variant="ghost"
                />
              }
            >
              <SlidersHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Group by</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  onValueChange={(value) =>
                    onGroupByChange(value as GroupByOption)
                  }
                  value={groupBy}
                >
                  <DropdownMenuRadioItem value="none">
                    None
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="date">
                    Date
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="project">
                    Project
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="unread">
                    Unread
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="status">
                    Status
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-2">
        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {totalCount === 0 ? (
            <p className="text-muted-foreground px-2 py-2 text-sm">
              No conversations yet.
            </p>
          ) : (
            <>
              {pinned.length > 0 ? (
                <CollapsibleSection
                  count={pinned.length}
                  open={pinnedOpen}
                  onToggle={() => setPinnedOpen((value) => !value)}
                  title="Pinned"
                >
                  <SessionList
                    activeSessionId={activeSessionId}
                    groupBy={groupBy}
                    onDeleteSession={onDeleteSession}
                    onPreferencesChange={onPreferencesChange}
                    onRenameSession={onRenameSession}
                    onSelectSession={onSelectSession}
                    preferences={preferences}
                    sessions={pinned}
                  />
                </CollapsibleSection>
              ) : null}

              {recents.length > 0 ? (
                <CollapsibleSection
                  count={recents.length}
                  open={recentsOpen}
                  onToggle={() => setRecentsOpen((value) => !value)}
                  title="Recents"
                >
                  <SessionList
                    activeSessionId={activeSessionId}
                    groupBy={groupBy}
                    onDeleteSession={onDeleteSession}
                    onPreferencesChange={onPreferencesChange}
                    onRenameSession={onRenameSession}
                    onSelectSession={onSelectSession}
                    preferences={preferences}
                    sessions={recents}
                  />
                </CollapsibleSection>
              ) : null}

              {archived.length > 0 ? (
                <CollapsibleSection
                  count={archived.length}
                  open={archiveOpen}
                  onToggle={() => setArchiveOpen((value) => !value)}
                  title="Archive"
                >
                  <SessionList
                    activeSessionId={activeSessionId}
                    groupBy={groupBy}
                    onDeleteSession={onDeleteSession}
                    onPreferencesChange={onPreferencesChange}
                    onRenameSession={onRenameSession}
                    onSelectSession={onSelectSession}
                    preferences={preferences}
                    sessions={archived}
                  />
                </CollapsibleSection>
              ) : null}
            </>
          )}
        </div>
        <div className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t" />
      </div>
    </aside>
  )
}
