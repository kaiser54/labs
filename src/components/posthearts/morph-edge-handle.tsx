import clsx from 'clsx'
import { motion } from 'motion/react'
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

/**
 * Panel edge resize handle — pill at rest, chevron while dragging
 * (3-line morph: https://benji.org/morphing-icons-with-claude).
 */

type Line = {
  x1: number
  y1: number
  x2: number
  y2: number
  opacity: number
}

type Edge = 'n' | 's' | 'e' | 'w'
type DragResizeDirection = 'grow' | 'shrink'
type ChevronIcon = 'chev-left' | 'chev-right' | 'chev-up' | 'chev-down'
type MorphIcon = 'grip-v' | 'grip-h' | ChevronIcon

const VIEW = 14
const CENTER = VIEW / 2
const COLLAPSED: Line = {
  x1: CENTER,
  y1: CENTER,
  x2: CENTER,
  y2: CENTER,
  opacity: 0,
}

/** Axis delta (px) before morph / direction lock. */
const DRAG_MORPH_THRESHOLD = 1

const GRIP_V: Line[] = [
  { x1: 7, y1: 1.5, x2: 7, y2: 12.5, opacity: 1 },
  COLLAPSED,
  COLLAPSED,
]

const GRIP_H: Line[] = [
  { x1: 1.5, y1: 7, x2: 12.5, y2: 7, opacity: 1 },
  COLLAPSED,
  COLLAPSED,
]

const CHEV_LEFT: Line[] = [
  { x1: 9.5, y1: 11.5, x2: 4.6, y2: 7.2, opacity: 1 },
  { x1: 4.6, y1: 6.8, x2: 9.5, y2: 2.5, opacity: 1 },
  COLLAPSED,
]

/** CSS-rotate(90deg) of CHEV_LEFT — top/bottom morph into this at 0° / 180°. */
const CHEV_UP: Line[] = [
  { x1: 2.5, y1: 9.5, x2: 6.8, y2: 4.6, opacity: 1 },
  { x1: 7.2, y1: 4.6, x2: 11.5, y2: 9.5, opacity: 1 },
  COLLAPSED,
]

const resolveLines = (icon: MorphIcon): Line[] => {
  switch (icon) {
    case 'grip-v':
      return GRIP_V
    case 'grip-h':
      return GRIP_H
    case 'chev-left':
    case 'chev-right':
      return CHEV_LEFT
    case 'chev-up':
    case 'chev-down':
      return CHEV_UP
  }
}

const resolveRotation = (icon: MorphIcon): number =>
  icon === 'chev-right' || icon === 'chev-down' ? 180 : 0

const MORPH_TRANSITION = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
  mass: 0.6,
}

const FLIP_TRANSITION = { duration: 0.12, ease: 'easeOut' as const }

const MorphIconSvg = ({
  icon,
  active,
}: {
  icon: MorphIcon
  active?: boolean
}) => {
  const lines = resolveLines(icon)
  const rotation = resolveRotation(icon)
  const stroke = active ? '#595959' : '#b2b2b2'

  return (
    <motion.svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      width={14}
      height={14}
      overflow="visible"
      animate={{ rotate: rotation }}
      transition={icon.startsWith('chev-') ? FLIP_TRANSITION : MORPH_TRANSITION}
      aria-hidden
    >
      {lines.map((line, index) => (
        <motion.line
          key={index}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          opacity={line.opacity}
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={false}
          animate={{
            x1: line.x1,
            y1: line.y1,
            x2: line.x2,
            y2: line.y2,
            opacity: line.opacity,
          }}
          transition={MORPH_TRANSITION}
        />
      ))}
    </motion.svg>
  )
}

const chevronForEdgeAndDrag = (
  edge: Edge,
  direction: DragResizeDirection,
): ChevronIcon => {
  switch (edge) {
    case 'w':
      return direction === 'grow' ? 'chev-left' : 'chev-right'
    case 'e':
      return direction === 'grow' ? 'chev-right' : 'chev-left'
    case 'n':
      return direction === 'grow' ? 'chev-up' : 'chev-down'
    case 's':
      return direction === 'grow' ? 'chev-down' : 'chev-up'
  }
}

const dragDirectionForEdge = (
  edge: Edge,
  dx: number,
  dy: number,
): DragResizeDirection | null => {
  const delta = edge === 'n' || edge === 's' ? dy : dx
  if (Math.abs(delta) < DRAG_MORPH_THRESHOLD) {
    return null
  }
  const growing =
    edge === 'w'
      ? dx < 0
      : edge === 'e'
        ? dx > 0
        : edge === 'n'
          ? dy < 0
          : dy > 0
  return growing ? 'grow' : 'shrink'
}

const ICON_OFFSET: Record<Edge, string> = {
  w: 'top-1/2 left-3 -translate-x-full -translate-y-1/2',
  e: 'top-1/2 right-3 translate-x-full -translate-y-1/2',
  n: 'top-3 left-1/2 -translate-x-1/2 -translate-y-full',
  s: 'bottom-3 left-1/2 -translate-x-1/2 translate-y-full',
}

type MorphEdgeHandleProps = {
  edge: Edge
  isDragging: boolean
  isProximate: boolean
  className?: string
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
}

export const MorphEdgeHandle = ({
  edge,
  isDragging,
  isProximate,
  className,
  onPointerDown,
}: MorphEdgeHandleProps) => {
  const [edgeHovered, setEdgeHovered] = useState(false)
  const [dragDirection, setDragDirection] =
    useState<DragResizeDirection | null>(null)
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null)

  const reveal = isProximate || edgeHovered || isDragging
  const morph = dragDirection != null
  const isVertical = edge === 'w' || edge === 'e'

  useEffect(() => {
    if (!isDragging) {
      setDragDirection(null)
      dragOriginRef.current = null
      setEdgeHovered(false)
      return
    }

    const onPointerMove = (event: PointerEvent) => {
      const origin = dragOriginRef.current
      if (!origin) {
        return
      }
      const next = dragDirectionForEdge(
        edge,
        event.clientX - origin.x,
        event.clientY - origin.y,
      )
      if (next) {
        setDragDirection((prev) => (prev === next ? prev : next))
      }
    }

    window.addEventListener('pointermove', onPointerMove)
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [isDragging, edge])

  return (
    <div
      role="separator"
      aria-orientation={isVertical ? 'vertical' : 'horizontal'}
      aria-label={`Resize panel ${edge}`}
      data-base-ui-swipe-ignore
      className={clsx(
        'absolute z-20 flex touch-none items-center justify-center',
        isVertical ? 'flex-col' : 'flex-row',
        className,
      )}
      onPointerDown={(event) => {
        dragOriginRef.current = { x: event.clientX, y: event.clientY }
        setDragDirection(null)
        onPointerDown(event)
      }}
      onPointerEnter={() => setEdgeHovered(true)}
      onPointerLeave={() => {
        if (!isDragging) {
          setEdgeHovered(false)
        }
      }}
    >
      <motion.div
        className={clsx(
          'pointer-events-none absolute flex items-center justify-center',
          ICON_OFFSET[edge],
        )}
        initial={false}
        animate={{
          opacity: reveal ? 1 : 0,
          scale: morph ? 1.1 : reveal ? 1 : 0.92,
        }}
        transition={{ duration: 0.16 }}
      >
        <MorphIconSvg
          icon={
            morph
              ? chevronForEdgeAndDrag(edge, dragDirection)
              : isVertical
                ? 'grip-v'
                : 'grip-h'
          }
          active={morph}
        />
      </motion.div>
    </div>
  )
}

export const EDGE_PROXIMITY_RATIO = 0.15

export type CardinalEdge = Edge

export const getProximateEdges = (
  clientX: number,
  clientY: number,
  panel: DOMRect,
): Set<CardinalEdge> => {
  const edges = new Set<CardinalEdge>()
  if (panel.width <= 0 || panel.height <= 0) {
    return edges
  }

  const relX = (clientX - panel.left) / panel.width
  const relY = (clientY - panel.top) / panel.height
  const outsidePadX = 12 / panel.width
  const outsidePadY = 12 / panel.height

  if (relX >= -outsidePadX && relX <= EDGE_PROXIMITY_RATIO) {
    edges.add('w')
  }
  if (relX >= 1 - EDGE_PROXIMITY_RATIO && relX <= 1 + outsidePadX) {
    edges.add('e')
  }
  if (relY >= -outsidePadY && relY <= EDGE_PROXIMITY_RATIO) {
    edges.add('n')
  }
  if (relY >= 1 - EDGE_PROXIMITY_RATIO && relY <= 1 + outsidePadY) {
    edges.add('s')
  }

  return edges
}
