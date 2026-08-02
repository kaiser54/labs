import { Drawer } from '@base-ui/react/drawer'
import { motion } from 'motion/react'
import {
  type TransitionEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Icon } from '@/components/icon'
import { Avatar } from '@/components/posthearts/avatar'
import {
  type CardinalEdge,
  getProximateEdges,
  MorphEdgeHandle,
} from '@/components/posthearts/morph-edge-handle'
import {
  type FloatingPanelResizeEdge,
  useFloatingPanel,
} from '@/components/posthearts/use-floating-panel'
import { ThreadPanelDetail } from '@/components/thread-panel-detail'
import { buttonVariants } from '@/components/ui/button'
import { tabs, threads, type TabId, type Thread } from '@/data/posthearts'
import { cn } from '@/lib/utils'

const CORNER_RESIZE_HANDLES: {
  edge: FloatingPanelResizeEdge
  className: string
}[] = [
  { edge: 'ne', className: '-top-3 -right-3 size-8 cursor-nesw-resize' },
  { edge: 'nw', className: '-top-3 -left-3 size-8 cursor-nwse-resize' },
  { edge: 'se', className: '-right-3 -bottom-3 size-8 cursor-nwse-resize' },
  { edge: 'sw', className: '-bottom-3 -left-3 size-8 cursor-nesw-resize' },
]

const CARDINAL_RESIZE_HANDLES: {
  edge: 'n' | 's' | 'e' | 'w'
  className: string
}[] = [
  { edge: 'n', className: '-top-3 right-8 left-8 h-8 cursor-ns-resize' },
  { edge: 's', className: '-bottom-3 right-8 left-8 h-8 cursor-ns-resize' },
  { edge: 'e', className: '-right-3 top-8 bottom-8 w-8 cursor-ew-resize' },
  { edge: 'w', className: '-left-3 top-8 bottom-8 w-8 cursor-ew-resize' },
]

const STACK_POPUP_SHELL_CLASSNAME = [
  'group/popup fixed flex flex-col gap-0 overflow-visible p-0 outline-none',
  '[--bleed:0px] [--peek:0.75rem] [--stack-step:0.05]',
  '[--stack-progress:clamp(0,var(--drawer-swipe-progress,0),1)]',
  '[--stack-peek-offset:max(0px,calc((var(--nested-drawers,0)-var(--stack-progress))*var(--peek)))]',
  '[--scale-base:calc(max(0,1-(var(--nested-drawers,0)*var(--stack-step))))]',
  '[--scale:clamp(0,calc(var(--scale-base)+(var(--stack-step)*var(--stack-progress))),1)]',
  '[--shrink:calc(1-var(--scale))]',
  '[--width:max(0px,calc(100%-var(--bleed)))]',
  '[transform-origin:100%_50%]',
  '[transform:translate3d(calc(var(--drawer-swipe-movement-x,0px)_-_var(--stack-peek-offset)_-_(var(--shrink)*var(--width))),var(--drawer-swipe-movement-y,0px),0)_scale(var(--scale))]',
  '[transition:transform_200ms_cubic-bezier(0.32,0.72,0,1),opacity_200ms_cubic-bezier(0.32,0.72,0,1)]',
  'will-change-transform data-swiping:select-none data-swiping:duration-0',
  'data-nested-drawer-swiping:duration-0',
  'data-starting-style:opacity-0 data-starting-style:[transform:translate3d(calc(50%+1rem),0,0)]',
  'data-ending-style:opacity-0 data-ending-style:[transform:translate3d(calc(50%+1rem),0,0)]',
].join(' ')

const STACK_POPUP_CHROME_CLASSNAME = [
  'rounded-[12px] border border-ph-border bg-white shadow-ph',
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[12px] after:bg-transparent after:content-['']",
  'after:transition-[background-color] after:duration-200 after:ease-[cubic-bezier(0.32,0.72,0,1)]',
  'group-data-nested-drawer-open/popup:after:bg-black/5',
].join(' ')

const STACK_POPUP_FRAME_CLASSNAME = cn(
  'relative flex flex-col overflow-visible',
  STACK_POPUP_CHROME_CLASSNAME,
)

const STACK_CONTENT_CLASSNAME =
  'flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[12px] transition-opacity duration-200 ease-[cubic-bezier(0.45,1.005,0,1.005)] group-data-nested-drawer-open/popup:opacity-0 group-data-nested-drawer-swiping/popup:opacity-100'

const iconBtn = cn(
  buttonVariants({ variant: 'ghost', size: 'icon-xs' }),
  'size-6 rounded-md text-ph-text hover:bg-ph-bg active:scale-[0.97]',
)

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

function ThreadItem({
  thread,
  onOpen,
}: {
  thread: Thread
  onOpen: (thread: Thread) => void
}) {
  const muted = thread.resolved

  return (
    <button
      type="button"
      onClick={() => onOpen(thread)}
      className="relative w-full px-5 py-4 text-left transition-colors duration-150 hover:bg-ph-bg/70 active:bg-ph-bg"
    >
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
                'flex min-w-0 items-center gap-1.5 type-ph',
                muted ? 'text-ph-muted' : 'text-ph-text',
              )}
            >
              <span className="truncate font-medium">{thread.name}</span>
              <span className="shrink-0 font-ph-regular text-ph-muted">
                {thread.time}
              </span>
            </div>
            {muted ? <Icon name="check" className="text-ph-success" /> : null}
          </div>

          <div className="flex flex-col items-start gap-2 pb-1.5">
            <p
              className={cn(
                'line-clamp-2 w-full type-ph',
                muted
                  ? 'font-ph-regular text-ph-muted'
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
                  'inline-flex items-center gap-1 rounded border border-ph-border bg-ph-bg pr-1.5 pl-0.5 font-code type-ph-micro font-medium',
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
            <div className="flex items-center gap-1.5 py-1 type-ph font-medium text-ph-muted">
              <ReplyAvatars avatars={thread.replies.avatars} />
              {thread.replies.count}{' '}
              {thread.replies.count === 1 ? 'reply' : 'replies'}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function ResizeHandles({
  activeResizeEdge,
  proximateEdges,
  onResizeHandlePointerDown,
}: {
  activeResizeEdge: FloatingPanelResizeEdge | null
  proximateEdges: Set<CardinalEdge>
  onResizeHandlePointerDown: ReturnType<
    typeof useFloatingPanel
  >['onResizeHandlePointerDown']
}) {
  return (
    <>
      {CARDINAL_RESIZE_HANDLES.map(({ edge, className }) => (
        <MorphEdgeHandle
          key={edge}
          edge={edge}
          className={className}
          isDragging={activeResizeEdge === edge}
          isProximate={proximateEdges.has(edge)}
          onPointerDown={onResizeHandlePointerDown(edge)}
        />
      ))}
      {CORNER_RESIZE_HANDLES.map(({ edge, className }) => (
        <div
          key={edge}
          role="separator"
          aria-orientation="horizontal"
          aria-label={`Resize panel ${edge}`}
          data-base-ui-swipe-ignore
          className={cn('absolute z-20 touch-none', className)}
          onPointerDown={onResizeHandlePointerDown(edge)}
          tabIndex={0}
        />
      ))}
    </>
  )
}

export function PostheartsDrawer() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<TabId>('threads')
  const [detailThreadId, setDetailThreadId] = useState<string | null>(null)
  const [proximateEdges, setProximateEdges] = useState<Set<CardinalEdge>>(
    () => new Set(),
  )
  const panelRef = useRef<HTMLDivElement>(null)

  const {
    style: panelStyle,
    isInteracting,
    activeResizeEdge,
    stretch,
    snapLayout,
    onLayoutSnapComplete,
    onDragHandlePointerDown,
    onDragHandleDoubleClick,
    onResizeHandlePointerDown,
  } = useFloatingPanel()

  const detailThread = threads.find((t) => t.id === detailThreadId) ?? null
  const detailOpen = detailThread != null

  const panelWidth =
    typeof panelStyle.width === 'number' ? panelStyle.width : 0
  const panelHeight =
    typeof panelStyle.height === 'number' ? panelStyle.height : 0
  const isRubberBanding = stretch.scaleX !== 1 || stretch.scaleY !== 1
  const stretchFrameWidth = panelWidth * stretch.scaleX
  const stretchFrameHeight = panelHeight * stretch.scaleY
  const stretchFrameX =
    stretch.originX > 0.5 ? panelWidth - stretchFrameWidth : 0
  const stretchFrameY =
    stretch.originY > 0.5 ? panelHeight - stretchFrameHeight : 0
  const stretchTransition = activeResizeEdge
    ? { type: 'tween' as const, duration: 0 }
    : {
        type: 'spring' as const,
        stiffness: 480,
        damping: 22,
        mass: 0.7,
      }

  const layoutSnapStyle = snapLayout
    ? {
        transition:
          'left 380ms cubic-bezier(0.32, 0.72, 0, 1), top 380ms cubic-bezier(0.32, 0.72, 0, 1), width 380ms cubic-bezier(0.32, 0.72, 0, 1), height 380ms cubic-bezier(0.32, 0.72, 0, 1)',
      }
    : undefined

  const onPanelTransitionEnd = (event: TransitionEvent<HTMLElement>) => {
    if (!snapLayout) return
    if (
      event.propertyName === 'width' ||
      event.propertyName === 'height' ||
      event.propertyName === 'left' ||
      event.propertyName === 'top'
    ) {
      onLayoutSnapComplete()
    }
  }

  useEffect(() => {
    if (!open) {
      setDetailThreadId(null)
      setProximateEdges(new Set())
    }
  }, [open])

  useEffect(() => {
    if (detailOpen) {
      setProximateEdges(new Set())
    }
  }, [detailOpen])

  const updateEdgeProximity = (clientX: number, clientY: number) => {
    if (detailOpen) return
    const panel = panelRef.current
    if (!panel) return
    const next = getProximateEdges(
      clientX,
      clientY,
      panel.getBoundingClientRect(),
    )
    setProximateEdges((prev) => {
      if (
        prev.size === next.size &&
        [...next].every((edge) => prev.has(edge))
      ) {
        return prev
      }
      return next
    })
  }

  const visibleThreads = threads.filter((thread) => {
    if (tab === 'unread') return thread.unread
    if (tab === 'resolved') return thread.resolved
    return true
  })

  const openReply = (thread: Thread) => {
    setDetailThreadId(thread.id)
  }

  return (
    <>
      <button
        type="button"
        className={buttonVariants()}
        onClick={() => setOpen(true)}
      >
        Open Posthearts
      </button>

      <Drawer.Root
        open={open}
        onOpenChange={setOpen}
        modal={false}
        disablePointerDismissal
      >
        <Drawer.Portal>
          <Drawer.Viewport className="pointer-events-none fixed inset-0 z-40">
            <Drawer.Popup
              ref={panelRef}
              data-threads-panel=""
              initialFocus={false}
              finalFocus={false}
              style={{ ...panelStyle, ...layoutSnapStyle }}
              className={cn(
                STACK_POPUP_SHELL_CLASSNAME,
                'z-40 bg-transparent font-inter text-ph-text',
                open ? 'pointer-events-auto' : 'pointer-events-none',
                isInteracting && 'select-none',
              )}
              onTransitionEnd={onPanelTransitionEnd}
              onPointerMove={(event) => {
                updateEdgeProximity(event.clientX, event.clientY)
              }}
              onPointerLeave={() => {
                if (!isInteracting) {
                  setProximateEdges(new Set())
                }
              }}
            >
              <motion.div
                className={STACK_POPUP_FRAME_CLASSNAME}
                initial={false}
                animate={{
                  width: isRubberBanding ? stretchFrameWidth : '100%',
                  height: isRubberBanding ? stretchFrameHeight : '100%',
                  x: isRubberBanding ? stretchFrameX : 0,
                  y: isRubberBanding ? stretchFrameY : 0,
                }}
                transition={stretchTransition}
              >
                <Drawer.Content className={STACK_CONTENT_CLASSNAME}>
                  <div
                    className="flex shrink-0 cursor-grab items-center justify-between py-3 pr-5 pl-2 active:cursor-grabbing"
                    onPointerDown={onDragHandlePointerDown}
                    onDoubleClick={onDragHandleDoubleClick}
                    data-base-ui-swipe-ignore
                  >
                    <Drawer.Title className="px-3 type-ph font-medium">
                      Posthearts V.2
                    </Drawer.Title>
                    <Drawer.Description className="sr-only">
                      Comment threads for the current project
                    </Drawer.Description>
                    <div className="flex items-center gap-1" data-no-drag>
                      <button
                        type="button"
                        className={iconBtn}
                        aria-label="Search"
                      >
                        <Icon name="search" />
                      </button>
                      <button
                        type="button"
                        className={iconBtn}
                        aria-label="Filter"
                      >
                        <Icon name="filter" />
                      </button>
                      <Drawer.Close className={iconBtn} aria-label="Close">
                        <Icon name="close" />
                      </Drawer.Close>
                    </div>
                  </div>

                  <div className="h-px bg-ph-divider" />

                  <div className="flex shrink-0 items-center px-2 py-1">
                    <button
                      type="button"
                      className="inline-flex h-7 items-center gap-1 rounded-md px-3 type-ph font-medium hover:bg-ph-bg"
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
                                'type-ph font-medium',
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
                      <ThreadItem
                        key={thread.id}
                        thread={thread}
                        onOpen={openReply}
                      />
                    ))}
                  </div>

                  <Drawer.Root
                    open={detailOpen}
                    onOpenChange={(next) => {
                      if (!next) setDetailThreadId(null)
                    }}
                    swipeDirection="right"
                    modal={false}
                    disablePointerDismissal
                  >
                    <Drawer.Portal>
                      <Drawer.Viewport className="pointer-events-none fixed inset-0 z-50">
                        <Drawer.Popup
                          data-slot="thread-panel-detail"
                          initialFocus={false}
                          finalFocus={false}
                          style={{ ...panelStyle, ...layoutSnapStyle }}
                          className={cn(
                            STACK_POPUP_SHELL_CLASSNAME,
                            STACK_POPUP_CHROME_CLASSNAME,
                            'relative z-50 flex min-h-0 min-w-0 flex-col overflow-visible font-inter text-ph-text transition-[opacity,transform]',
                            detailOpen
                              ? 'pointer-events-auto'
                              : 'pointer-events-none',
                          )}
                          onTransitionEnd={onPanelTransitionEnd}
                          onPointerMove={(event) => {
                            updateEdgeProximity(event.clientX, event.clientY)
                          }}
                          onPointerLeave={() => {
                            if (!isInteracting) {
                              setProximateEdges(new Set())
                            }
                          }}
                        >
                          <Drawer.Content className={STACK_CONTENT_CLASSNAME}>
                            {detailThread ? (
                              <ThreadPanelDetail
                                thread={detailThread}
                                dragHandle={{
                                  onPointerDown: onDragHandlePointerDown,
                                  onDoubleClick: onDragHandleDoubleClick,
                                }}
                              />
                            ) : null}
                          </Drawer.Content>
                        </Drawer.Popup>
                      </Drawer.Viewport>
                    </Drawer.Portal>
                  </Drawer.Root>
                </Drawer.Content>

                {!detailOpen ? (
                  <ResizeHandles
                    activeResizeEdge={activeResizeEdge}
                    proximateEdges={proximateEdges}
                    onResizeHandlePointerDown={onResizeHandlePointerDown}
                  />
                ) : null}
              </motion.div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}
