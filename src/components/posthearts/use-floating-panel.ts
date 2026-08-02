import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

export const THREADS_PANEL_DEFAULT_WIDTH = 380
export const THREADS_PANEL_MIN_WIDTH = 320
export const THREADS_PANEL_MAX_WIDTH = 500
export const THREADS_PANEL_MIN_HEIGHT = 400
/** Inset from the viewport edge on all sides. */
export const THREADS_PANEL_MARGIN = 16

type PanelRect = {
  x: number
  y: number
  width: number
  height: number
}

export type FloatingPanelResizeEdge =
  | 'n'
  | 's'
  | 'e'
  | 'w'
  | 'ne'
  | 'nw'
  | 'se'
  | 'sw'

type DragMode =
  | {
      type: 'move'
      pointerId: number
      startX: number
      startY: number
      origin: PanelRect
    }
  | {
      type: 'resize'
      pointerId: number
      edge: FloatingPanelResizeEdge
      origin: PanelRect
      /** Pointer offset from the dragged edge at grab time. */
      grabOffsetX: number
      grabOffsetY: number
    }

const RESIZE_CURSOR: Record<FloatingPanelResizeEdge, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
}

const getViewport = () => ({
  width: window.innerWidth,
  height: window.innerHeight,
})

const getMaxHeight = (viewportHeight: number) =>
  Math.max(THREADS_PANEL_MIN_HEIGHT, viewportHeight - THREADS_PANEL_MARGIN * 2)

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

/**
 * Progressive rubber-band scale past min/max size.
 * `delta > 0` → stretch past max; `delta < 0` → shrink past min.
 */
const scaleFromOverdrag = (delta: number, dimension: number) => {
  if (delta === 0 || dimension <= 0) {
    return 1
  }
  const heaviness = 0.28
  const distance = Math.abs(delta) / (dimension * heaviness)
  if (delta > 0) {
    const gain = 0.16
    return 1 + gain * Math.log1p(distance)
  }
  const gain = 0.07
  return Math.max(0.92, 1 - gain * Math.log1p(distance))
}

export type PanelStretch = {
  scaleX: number
  scaleY: number
  originX: number
  originY: number
}

const IDENTITY_STRETCH: PanelStretch = {
  scaleX: 1,
  scaleY: 1,
  originX: 0.5,
  originY: 0.5,
}

const stretchOriginForEdge = (
  edge: FloatingPanelResizeEdge,
): Pick<PanelStretch, 'originX' | 'originY'> => ({
  originX: edge.includes('w') ? 1 : edge.includes('e') ? 0 : 0.5,
  originY: edge.includes('n') ? 1 : edge.includes('s') ? 0 : 0.5,
})

const getDefaultRect = (): PanelRect => {
  const viewport = getViewport()
  const width = Math.min(
    THREADS_PANEL_DEFAULT_WIDTH,
    Math.max(
      THREADS_PANEL_MIN_WIDTH,
      viewport.width - THREADS_PANEL_MARGIN * 2,
    ),
  )
  const height = getMaxHeight(viewport.height)

  return {
    x: Math.max(
      THREADS_PANEL_MARGIN,
      viewport.width - width - THREADS_PANEL_MARGIN,
    ),
    y: THREADS_PANEL_MARGIN,
    width,
    height,
  }
}

const clampRectToViewport = (rect: PanelRect): PanelRect => {
  const viewport = getViewport()
  const maxWidth = Math.min(
    THREADS_PANEL_MAX_WIDTH,
    viewport.width - THREADS_PANEL_MARGIN * 2,
  )
  const maxHeight = getMaxHeight(viewport.height)
  const width = clamp(rect.width, THREADS_PANEL_MIN_WIDTH, maxWidth)
  const height = clamp(rect.height, THREADS_PANEL_MIN_HEIGHT, maxHeight)

  return {
    width,
    height,
    x: clamp(
      rect.x,
      THREADS_PANEL_MARGIN,
      Math.max(THREADS_PANEL_MARGIN, viewport.width - width - THREADS_PANEL_MARGIN),
    ),
    y: clamp(
      rect.y,
      THREADS_PANEL_MARGIN,
      Math.max(
        THREADS_PANEL_MARGIN,
        viewport.height - height - THREADS_PANEL_MARGIN,
      ),
    ),
  }
}

/** Opposite edge stays anchored; overdrag past min/max drives visual rubber-band. */
const applyResize = (
  edge: FloatingPanelResizeEdge,
  origin: PanelRect,
  pointerX: number,
  pointerY: number,
  grabOffsetX: number,
  grabOffsetY: number,
): { rect: PanelRect; stretch: PanelStretch } => {
  const viewport = getViewport()
  const maxWidth = Math.min(
    THREADS_PANEL_MAX_WIDTH,
    viewport.width - THREADS_PANEL_MARGIN * 2,
  )
  const maxHeight = getMaxHeight(viewport.height)
  const right = origin.x + origin.width
  const bottom = origin.y + origin.height
  const edgeX = pointerX - grabOffsetX
  const edgeY = pointerY - grabOffsetY

  let rawWidth = origin.width
  let rawHeight = origin.height
  if (edge.includes('e')) {
    rawWidth = edgeX - origin.x
  }
  if (edge.includes('w')) {
    rawWidth = right - edgeX
  }
  if (edge.includes('s')) {
    rawHeight = edgeY - origin.y
  }
  if (edge.includes('n')) {
    rawHeight = bottom - edgeY
  }

  const width = clamp(rawWidth, THREADS_PANEL_MIN_WIDTH, maxWidth)
  const height = clamp(rawHeight, THREADS_PANEL_MIN_HEIGHT, maxHeight)

  let x = origin.x
  let y = origin.y
  if (edge.includes('e')) {
    x = origin.x
  } else if (edge.includes('w')) {
    x = right - width
  }
  if (edge.includes('s')) {
    y = origin.y
  } else if (edge.includes('n')) {
    y = bottom - height
  }

  const rect = {
    width,
    height,
    x: clamp(
      x,
      THREADS_PANEL_MARGIN,
      Math.max(THREADS_PANEL_MARGIN, viewport.width - width - THREADS_PANEL_MARGIN),
    ),
    y: clamp(
      y,
      THREADS_PANEL_MARGIN,
      Math.max(
        THREADS_PANEL_MARGIN,
        viewport.height - height - THREADS_PANEL_MARGIN,
      ),
    ),
  }

  const originXY = stretchOriginForEdge(edge)
  const widthDelta =
    rawWidth > maxWidth
      ? rawWidth - maxWidth
      : rawWidth < THREADS_PANEL_MIN_WIDTH
        ? rawWidth - THREADS_PANEL_MIN_WIDTH
        : 0
  const heightDelta =
    rawHeight > maxHeight
      ? rawHeight - maxHeight
      : rawHeight < THREADS_PANEL_MIN_HEIGHT
        ? rawHeight - THREADS_PANEL_MIN_HEIGHT
        : 0

  return {
    rect,
    stretch: {
      scaleX: scaleFromOverdrag(widthDelta, width),
      scaleY: scaleFromOverdrag(heightDelta, height),
      originX: originXY.originX,
      originY: originXY.originY,
    },
  }
}

const isInteractiveDragTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) {
    return false
  }
  return Boolean(
    target.closest("button, input, a, [role='button'], [data-no-drag]"),
  )
}

/**
 * Drag + edge/corner resize for the threads floating panel.
 * Position defaults to the top-right (previous sheet dock).
 */
export const useFloatingPanel = () => {
  const [rect, setRect] = useState<PanelRect>(() => getDefaultRect())
  const [isInteracting, setIsInteracting] = useState(false)
  const [activeResizeEdge, setActiveResizeEdge] =
    useState<FloatingPanelResizeEdge | null>(null)
  const [stretch, setStretch] = useState<PanelStretch>(IDENTITY_STRETCH)
  const [snapLayout, setSnapLayout] = useState(false)
  const rectRef = useRef(rect)
  const dragRef = useRef<DragMode | null>(null)
  const stopGestureRef = useRef<(() => void) | null>(null)
  const previousUserSelectRef = useRef('')
  const previousCursorRef = useRef('')

  useEffect(() => {
    rectRef.current = rect
  }, [rect])

  useEffect(() => {
    const onWindowResize = () => {
      setRect((current) => clampRectToViewport(current))
    }
    window.addEventListener('resize', onWindowResize)
    return () => window.removeEventListener('resize', onWindowResize)
  }, [])

  useEffect(() => {
    return () => {
      stopGestureRef.current?.()
    }
  }, [])

  const restoreDocumentChrome = useCallback(() => {
    document.body.style.userSelect = previousUserSelectRef.current
    document.body.style.cursor = previousCursorRef.current
  }, [])

  const startTracking = useCallback(
    (mode: DragMode, event: ReactPointerEvent<HTMLElement>, cursor: string) => {
      event.preventDefault()
      event.stopPropagation()

      stopGestureRef.current?.()

      previousUserSelectRef.current = document.body.style.userSelect
      previousCursorRef.current = document.body.style.cursor
      document.body.style.userSelect = 'none'
      document.body.style.cursor = cursor

      dragRef.current = mode
      setSnapLayout(false)
      setIsInteracting(true)

      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Window listeners below still track the gesture if capture fails.
      }

      const onPointerMove = (moveEvent: PointerEvent) => {
        const drag = dragRef.current
        if (!drag || moveEvent.pointerId !== drag.pointerId) {
          return
        }

        if (drag.type === 'move') {
          setRect(
            clampRectToViewport({
              ...drag.origin,
              x: drag.origin.x + (moveEvent.clientX - drag.startX),
              y: drag.origin.y + (moveEvent.clientY - drag.startY),
            }),
          )
          return
        }

        const { rect: nextRect, stretch: nextStretch } = applyResize(
          drag.edge,
          drag.origin,
          moveEvent.clientX,
          moveEvent.clientY,
          drag.grabOffsetX,
          drag.grabOffsetY,
        )
        setRect(nextRect)
        setStretch(nextStretch)
      }

      const endGesture = () => {
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', onPointerUp)
        window.removeEventListener('pointercancel', onPointerUp)
        dragRef.current = null
        stopGestureRef.current = null
        setIsInteracting(false)
        setActiveResizeEdge(null)
        setStretch((current) => ({
          ...IDENTITY_STRETCH,
          originX: current.originX,
          originY: current.originY,
        }))
        restoreDocumentChrome()
      }

      const onPointerUp = (upEvent: PointerEvent) => {
        const drag = dragRef.current
        if (!drag || upEvent.pointerId !== drag.pointerId) {
          return
        }
        endGesture()
      }

      stopGestureRef.current = endGesture
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerUp)
    },
    [restoreDocumentChrome],
  )

  const onDragHandlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0 || isInteractiveDragTarget(event.target)) {
        return
      }
      startTracking(
        {
          type: 'move',
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          origin: rectRef.current,
        },
        event,
        'grabbing',
      )
    },
    [startTracking],
  )

  const onDragHandleDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (isInteractiveDragTarget(event.target)) {
        return
      }
      event.preventDefault()
      setStretch(IDENTITY_STRETCH)
      setRect((current) => {
        const next = getDefaultRect()
        const unchanged =
          next.x === current.x &&
          next.y === current.y &&
          next.width === current.width &&
          next.height === current.height
        if (!unchanged) {
          setSnapLayout(true)
        }
        return next
      })
    },
    [],
  )

  const onLayoutSnapComplete = useCallback(() => {
    setSnapLayout(false)
  }, [])

  useEffect(() => {
    if (!snapLayout) {
      return
    }
    const timeoutId = window.setTimeout(() => {
      setSnapLayout(false)
    }, 450)
    return () => window.clearTimeout(timeoutId)
  }, [snapLayout])

  const onResizeHandlePointerDown = useCallback(
    (edge: FloatingPanelResizeEdge) =>
      (event: ReactPointerEvent<HTMLElement>) => {
        if (event.button !== 0) {
          return
        }

        const origin = rectRef.current
        const right = origin.x + origin.width
        const bottom = origin.y + origin.height
        const edgeX = edge.includes('e')
          ? right
          : edge.includes('w')
            ? origin.x
            : event.clientX
        const edgeY = edge.includes('s')
          ? bottom
          : edge.includes('n')
            ? origin.y
            : event.clientY

        startTracking(
          {
            type: 'resize',
            pointerId: event.pointerId,
            edge,
            origin,
            grabOffsetX: event.clientX - edgeX,
            grabOffsetY: event.clientY - edgeY,
          },
          event,
          RESIZE_CURSOR[edge],
        )
        setActiveResizeEdge(edge)
      },
    [startTracking],
  )

  const style: CSSProperties = {
    top: rect.y,
    left: rect.x,
    width: rect.width,
    height: rect.height,
  }

  return {
    style,
    isInteracting,
    activeResizeEdge,
    stretch,
    snapLayout,
    onLayoutSnapComplete,
    onDragHandlePointerDown,
    onDragHandleDoubleClick,
    onResizeHandlePointerDown,
  }
}
