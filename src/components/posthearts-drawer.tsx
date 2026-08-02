import { useState } from 'react'

import { Icon } from '@/components/icon'
import { buttonVariants } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { tabs, threads, type TabId, type Thread } from '@/data/posthearts'
import { cn } from '@/lib/utils'

const iconBtn = cn(
  buttonVariants({ variant: 'ghost', size: 'icon-xs' }),
  'size-6 rounded-md text-ph-text hover:bg-ph-bg active:scale-[0.97]',
)

function Avatar({
  src,
  name,
  initials,
  initialsColor,
  dimmed,
}: {
  src?: string
  name: string
  initials?: string
  initialsColor?: string
  dimmed?: boolean
}) {
  if (initials) {
    return (
      <div
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white',
          dimmed && 'opacity-50',
        )}
        style={{ backgroundColor: initialsColor }}
        aria-label={name}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      className={cn(
        'size-6 shrink-0 rounded-full object-cover',
        dimmed && 'opacity-50',
      )}
    />
  )
}

function ReplyAvatars({ avatars }: { avatars: string[] }) {
  if (avatars.length === 1) {
    return (
      <img
        src={avatars[0]}
        alt=""
        className="size-4 rounded-full object-cover ring-1 ring-white"
      />
    )
  }

  return (
    <div className="relative size-5 shrink-0">
      <img
        src={avatars[0]}
        alt=""
        className="absolute top-0 left-0 size-4 rounded-full object-cover"
      />
      <img
        src={avatars[1]}
        alt=""
        className="absolute right-0 bottom-0 size-4 rounded-full object-cover ring-1 ring-white"
      />
    </div>
  )
}

function ThreadItem({ thread }: { thread: Thread }) {
  const muted = thread.resolved

  return (
    <article className="relative px-5 py-4">
      {thread.unread ? (
        <span className="absolute top-6 left-1.75 size-2 rounded-full bg-ph-accent" />
      ) : null}

      <div className="flex items-start gap-2">
        <div className="flex w-6 shrink-0 flex-col items-center self-stretch">
          <Avatar
            src={thread.avatar}
            name={thread.name}
            initials={thread.initials}
            initialsColor={thread.initialsColor}
            dimmed={muted}
          />
          {thread.replies ? (
            <div
              className="mt-2 mb-2.5 ml-px w-3 flex-1 rounded-bl-full border-b border-l border-ph-border"
              aria-hidden
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex h-6 items-center justify-between gap-2">
            <div
              className={cn(
                'flex min-w-0 items-center gap-1.5 text-ph',
                muted ? 'text-ph-muted' : 'text-ph-text',
              )}
            >
              <span className="truncate font-medium">{thread.name}</span>
              <span className="shrink-0 font-normal text-ph-muted">
                {thread.time}
              </span>
            </div>
            {muted ? <Icon name="check" className="text-ph-success" /> : null}
          </div>

          <div className="flex flex-col items-start gap-2 pb-1.5">
            <p
              className={cn(
                'line-clamp-2 w-full text-ph',
                muted
                  ? 'font-normal text-ph-muted'
                  : 'font-medium text-ph-text',
              )}
            >
              {thread.body}
            </p>

            {thread.attachment ? (
              <img
                src={thread.attachment}
                alt=""
                className="size-8 rounded-md border border-ph-divider object-cover object-top-left"
              />
            ) : null}

            {thread.issue ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded border border-ph-border bg-ph-bg pr-1.5 pl-0.5 font-code text-xs font-medium',
                  muted ? 'text-ph-muted' : 'text-ph-text',
                )}
              >
                <span className="flex size-4.5 items-center justify-center">
                  <Icon name="linear" className="size-3" />
                </span>
                {thread.issue}
              </span>
            ) : null}
          </div>

          {thread.replies ? (
            <div className="flex items-center gap-1.5 py-1 text-ph font-medium text-ph-muted">
              <ReplyAvatars avatars={thread.replies.avatars} />
              {thread.replies.count}{' '}
              {thread.replies.count === 1 ? 'reply' : 'replies'}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export function PostheartsDrawer() {
  const [tab, setTab] = useState<TabId>('threads')

  const visibleThreads = threads.filter((thread) => {
    if (tab === 'unread') return thread.unread
    if (tab === 'resolved') return thread.resolved
    return true
  })

  return (
    <Drawer modal={false} swipeDirection="right">
      <DrawerTrigger className={buttonVariants()}>Open Posthearts</DrawerTrigger>

      <DrawerContent
        className={cn(
          'posthearts-drawer font-inter text-ph-text shadow-ph',
          'rounded-xl border border-ph-border bg-white',
          'data-[swipe-direction=right]:rounded-xl',
        )}
      >
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between py-3 pr-5 pl-2">
            <DrawerTitle className="px-3 text-ph font-medium">
              Posthearts V.2
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Comment threads for the current project
            </DrawerDescription>
            <div className="flex items-center gap-1">
              <button type="button" className={iconBtn} aria-label="Search">
                <Icon name="search" />
              </button>
              <button type="button" className={iconBtn} aria-label="Filter">
                <Icon name="filter" />
              </button>
              <DrawerClose className={iconBtn} aria-label="Close">
                <Icon name="close" />
              </DrawerClose>
            </div>
          </header>

          <div className="h-px bg-ph-divider" />

          <div className="flex shrink-0 items-center px-2 py-1">
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1 rounded-md px-3 text-ph font-medium hover:bg-ph-bg"
            >
              All pages
              <Icon name="chevron-down" />
            </button>
          </div>

          <div className="flex shrink-0 gap-4 border-b border-ph-divider px-5">
            {tabs.map((item) => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className="flex flex-col gap-0.5"
                >
                  <span className="flex h-7 items-center gap-1">
                    <span
                      className={cn(
                        'text-ph font-medium',
                        active ? 'text-ph-text' : 'text-ph-muted',
                      )}
                    >
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        'inline-flex h-4 items-center rounded-full px-1.5 text-xs font-medium',
                        active
                          ? 'bg-ph-clicked text-ph-text'
                          : 'border border-ph-divider bg-ph-bg text-ph-muted',
                      )}
                    >
                      {item.count}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'h-0.5 bg-ph-text',
                      active ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </button>
              )
            })}
          </div>

          <div className="min-h-0 flex-1 divide-y divide-ph-divider overflow-y-auto">
            {visibleThreads.map((thread) => (
              <ThreadItem key={thread.id} thread={thread} />
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
