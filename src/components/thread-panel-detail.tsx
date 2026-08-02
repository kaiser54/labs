import { Drawer } from '@base-ui/react/drawer'
import {
  type ComponentProps,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Icon } from '@/components/icon'
import { Avatar } from '@/components/posthearts/avatar'
import { getThreadComments, type Thread } from '@/data/posthearts'
import { cn } from '@/lib/utils'

const iconBtn =
  'inline-flex size-6 items-center justify-center rounded-md text-ph-text outline-none transition-transform duration-150 hover:bg-ph-bg active:scale-[0.97]'

export function ThreadPanelDetail({
  thread,
  dragHandle,
}: {
  thread: Thread
  dragHandle?: Pick<
    ComponentProps<'div'>,
    'onPointerDown' | 'onDoubleClick'
  >
}) {
  const comments = getThreadComments(thread)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [comments.length, thread.id])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden font-inter text-ph-text">
      <header
        className={cn(
          'flex shrink-0 items-center justify-between py-3 pr-5 pl-2',
          dragHandle && 'cursor-grab active:cursor-grabbing',
        )}
        data-base-ui-swipe-ignore={dragHandle ? '' : undefined}
        onPointerDown={dragHandle?.onPointerDown}
        onDoubleClick={dragHandle?.onDoubleClick}
      >
        <div className="flex items-center gap-1" data-no-drag>
          <Drawer.Close className={iconBtn} aria-label="Back to threads">
            <Icon name="chevron-left" />
          </Drawer.Close>
          <Drawer.Title className="px-1 type-ph font-medium">
            Thread
          </Drawer.Title>
          <Drawer.Description className="sr-only">
            Replies for {thread.name}
          </Drawer.Description>
        </div>
        {thread.resolved ? (
          <Icon name="check" className="mr-1 text-ph-success" />
        ) : null}
      </header>

      <div className="h-px bg-ph-divider" />

      <div
        ref={scrollerRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4"
      >
        {comments.map((comment, index) => (
          <div key={comment.id} className="flex items-start gap-2">
            <Avatar
              src={comment.avatar}
              name={comment.name}
              initials={comment.initials}
              initialsColor={comment.initialsColor}
            />
            <div className="min-w-0 flex-1">
              <div className="flex h-6 items-center gap-1.5 type-ph">
                <span className="truncate font-medium">{comment.name}</span>
                <span className="shrink-0 font-ph-regular text-ph-muted">
                  {comment.time}
                </span>
              </div>
              <p
                className={cn(
                  'whitespace-pre-wrap type-ph',
                  index === 0 ? 'font-medium' : 'font-ph-regular',
                )}
              >
                {comment.body}
              </p>
              {index === 0 && thread.attachment ? (
                <img
                  src={thread.attachment}
                  alt=""
                  className="mt-2 size-16 rounded-md border border-ph-divider object-cover object-top-left"
                />
              ) : null}
              {index === 0 && thread.issue ? (
                <span className="mt-2 inline-flex items-center gap-1 rounded border border-ph-border bg-ph-bg pr-1.5 pl-0.5 font-code type-ph-micro font-medium text-ph-text">
                  <span className="flex size-4.5 items-center justify-center">
                    <Icon name="linear" className="size-3" />
                  </span>
                  {thread.issue}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-ph-divider p-3">
        {thread.resolved ? (
          <p className="px-1 type-ph text-ph-muted">
            This thread is resolved. Replies are disabled.
          </p>
        ) : (
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setDraft('')
            }}
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Reply…"
              rows={1}
              className="min-h-9 flex-1 resize-none rounded-lg border border-ph-border bg-ph-bg px-3 py-2 type-ph text-ph-text outline-none placeholder:text-ph-muted focus:border-ph-text/30"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="inline-flex h-9 items-center rounded-lg bg-ph-text px-3 type-ph font-medium text-white transition-transform duration-150 enabled:active:scale-[0.97] disabled:opacity-40"
            >
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
