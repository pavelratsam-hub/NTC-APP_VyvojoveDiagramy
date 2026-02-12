import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react'
import type { DiagramEdge, DiagramEdgeData } from '../../types/diagram'
import './Edges.css'

/* ── Geometry helpers ── */

type Point = { x: number; y: number }
type SegDir = 'h' | 'v'

function parsePathPoints(d: string): Point[] {
  const points: Point[] = []
  const regex = /([ML])\s*([\d.eE+-]+)[,\s]([\d.eE+-]+)/g
  let match
  while ((match = regex.exec(d)) !== null) {
    points.push({ x: parseFloat(match[2]), y: parseFloat(match[3]) })
  }
  return points
}

function buildPath(points: Point[]): string {
  if (points.length === 0) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ')
}

function segDir(a: Point, b: Point): SegDir | null {
  if (Math.abs(a.y - b.y) < 0.5) return 'h'
  if (Math.abs(a.x - b.x) < 0.5) return 'v'
  return null
}

/** Segment lengths for a polyline */
function segLengths(pts: Point[]): number[] {
  const lens: number[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x
    const dy = pts[i + 1].y - pts[i].y
    lens.push(Math.sqrt(dx * dx + dy * dy))
  }
  return lens
}

/** Point at parametric position t (0–1) along polyline */
function pointAtT(pts: Point[], t: number): Point {
  if (pts.length < 2) return pts[0] || { x: 0, y: 0 }
  const lens = segLengths(pts)
  const total = lens.reduce((a, b) => a + b, 0)
  if (total === 0) return pts[0]

  const target = Math.max(0, Math.min(1, t)) * total
  let acc = 0
  for (let i = 0; i < lens.length; i++) {
    if (acc + lens[i] >= target - 0.01) {
      const segT = lens[i] > 0 ? (target - acc) / lens[i] : 0
      return {
        x: pts[i].x + segT * (pts[i + 1].x - pts[i].x),
        y: pts[i].y + segT * (pts[i + 1].y - pts[i].y),
      }
    }
    acc += lens[i]
  }
  return pts[pts.length - 1]
}

/** Nearest parametric position (0–1) on polyline to a given point */
function nearestT(pts: Point[], p: Point): number {
  if (pts.length < 2) return 0
  const lens = segLengths(pts)
  const total = lens.reduce((a, b) => a + b, 0)
  if (total === 0) return 0

  let bestDist = Infinity
  let bestLen = 0
  let acc = 0

  for (let i = 0; i < lens.length; i++) {
    const ax = pts[i].x, ay = pts[i].y
    const dx = pts[i + 1].x - ax, dy = pts[i + 1].y - ay
    const segLen = lens[i]

    let t = 0
    if (segLen > 0) {
      t = Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.y - ay) * dy) / (segLen * segLen)))
    }
    const cx = ax + t * dx
    const cy = ay + t * dy
    const dist = (p.x - cx) ** 2 + (p.y - cy) ** 2

    if (dist < bestDist) {
      bestDist = dist
      bestLen = acc + t * segLen
    }
    acc += segLen
  }

  return bestLen / total
}

/* ── Draggable segments ── */

interface DraggableSeg {
  idx: number
  dir: SegDir
  midX: number
  midY: number
}

function findDraggableSegments(points: Point[]): DraggableSeg[] {
  const segs: DraggableSeg[] = []
  for (let i = 1; i < points.length - 2; i++) {
    const d = segDir(points[i], points[i + 1])
    if (d) {
      segs.push({
        idx: i,
        dir: d,
        midX: (points[i].x + points[i + 1].x) / 2,
        midY: (points[i].y + points[i + 1].y) / 2,
      })
    }
  }
  return segs
}

/* ── Component ── */

export function StepEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
}: EdgeProps<DiagramEdge>) {
  const [isEditing, setIsEditing] = useState(false)
  const [labelText, setLabelText] = useState(data?.label || '')
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const [labelDragging, setLabelDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { setEdges, screenToFlowPosition } = useReactFlow()

  // 1. Default path (no offsets)
  const [defaultPathD] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    borderRadius: 0,
  })

  // 2. Parse default points & segments
  const defaultPoints = useMemo(() => parsePathPoints(defaultPathD), [defaultPathD])
  const defaultSegs = useMemo(() => findDraggableSegments(defaultPoints), [defaultPoints])

  // 3. Apply stored segment offsets → modified path + segments
  const { edgePath, segments, modifiedPoints } = useMemo(() => {
    const offsets = data?.segmentOffsets
    const pts = defaultPoints.map(p => ({ ...p }))

    if (offsets && offsets.length === defaultSegs.length) {
      for (let i = 0; i < defaultSegs.length; i++) {
        const s = defaultSegs[i]
        const o = offsets[i] || 0
        if (o !== 0) {
          if (s.dir === 'h') {
            pts[s.idx].y += o
            pts[s.idx + 1].y += o
          } else {
            pts[s.idx].x += o
            pts[s.idx + 1].x += o
          }
        }
      }
    }

    return {
      edgePath: buildPath(pts),
      segments: findDraggableSegments(pts),
      modifiedPoints: pts,
    }
  }, [defaultPoints, defaultSegs, data?.segmentOffsets])

  // 4. Label position on polyline
  const labelT = data?.labelPosition ?? 0.5
  const labelPos = useMemo(() => pointAtT(modifiedPoints, labelT), [modifiedPoints, labelT])

  // Keep ref to modifiedPoints for drag closure
  const ptsRef = useRef(modifiedPoints)
  ptsRef.current = modifiedPoints

  // ── label editing ──

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleLabelDoubleClick = useCallback(() => {
    if (!labelDragging) setIsEditing(true)
  }, [labelDragging])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    setEdges((edges) =>
      edges.map((edge) =>
        edge.id === id ? { ...edge, data: { ...edge.data, label: labelText } } : edge
      )
    )
  }, [id, labelText, setEdges])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleBlur()
      if (e.key === 'Escape') {
        setLabelText(data?.label || '')
        setIsEditing(false)
      }
    },
    [handleBlur, data?.label]
  )

  const toggleStyle = useCallback(() => {
    setEdges((edges) =>
      edges.map((edge) =>
        edge.id === id
          ? {
              ...edge,
              data: {
                ...edge.data,
                lineStyle: edge.data?.lineStyle === 'dashed' ? 'solid' : 'dashed',
              },
            }
          : edge
      )
    )
  }, [id, setEdges])

  // ── label drag along path ──

  const handleLabelMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isEditing) return
      e.stopPropagation()

      const startX = e.clientX
      const startY = e.clientY
      let dragging = false

      const onMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        if (!dragging && dx * dx + dy * dy < 16) return // 4px threshold
        dragging = true
        setLabelDragging(true)

        const flow = screenToFlowPosition({ x: ev.clientX, y: ev.clientY })
        const t = nearestT(ptsRef.current, flow)

        setEdges((edges) =>
          edges.map((edge) =>
            edge.id === id
              ? { ...edge, data: { ...edge.data, labelPosition: t } }
              : edge
          )
        )
      }

      const onMouseUp = () => {
        // Reset dragging flag after a tick so double-click isn't blocked
        setTimeout(() => setLabelDragging(false), 0)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [id, isEditing, screenToFlowPosition, setEdges]
  )

  // ── segment drag ──

  const handleSegDragStart = useCallback(
    (segIdx: number, dir: SegDir) => (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      setDraggingIdx(segIdx)

      const defSeg = defaultSegs[segIdx]

      const onMouseMove = (ev: MouseEvent) => {
        const flow = screenToFlowPosition({ x: ev.clientX, y: ev.clientY })
        const offset = dir === 'h'
          ? flow.y - defSeg.midY
          : flow.x - defSeg.midX

        setEdges((edges) =>
          edges.map((edge) => {
            if (edge.id !== id) return edge
            const d = edge.data as DiagramEdgeData | undefined
            const prev = d?.segmentOffsets
            const newOffsets = prev && prev.length === defaultSegs.length
              ? [...prev]
              : new Array(defaultSegs.length).fill(0)
            newOffsets[segIdx] = offset
            return { ...edge, data: { ...edge.data, segmentOffsets: newOffsets } }
          })
        )
      }

      const onMouseUp = () => {
        setDraggingIdx(null)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [id, defaultSegs, screenToFlowPosition, setEdges]
  )

  const handleSegDblClick = useCallback(
    (segIdx: number) => (e: React.MouseEvent) => {
      e.stopPropagation()
      setEdges((edges) =>
        edges.map((edge) => {
          if (edge.id !== id) return edge
          const d = edge.data as DiagramEdgeData | undefined
          const prev = d?.segmentOffsets
          if (!prev) return edge
          const newOffsets = [...prev]
          newOffsets[segIdx] = 0
          if (newOffsets.every((o) => o === 0)) {
            return { ...edge, data: { ...edge.data, segmentOffsets: undefined } }
          }
          return { ...edge, data: { ...edge.data, segmentOffsets: newOffsets } }
        })
      )
    },
    [id, setEdges]
  )

  const isDashed = data?.lineStyle === 'dashed'

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ strokeDasharray: isDashed ? '5,5' : 'none' }}
      />

      {/* Segment drag handles */}
      {selected && segments.length > 0 && (
        <EdgeLabelRenderer>
          {segments.map((seg, i) => (
            <div
              key={`seg-${i}`}
              className={`edge-drag-handle ${draggingIdx === i ? 'dragging' : ''}`}
              style={{
                transform: `translate(-50%, -50%) translate(${seg.midX}px, ${seg.midY}px)`,
                cursor: seg.dir === 'h' ? 'ns-resize' : 'ew-resize',
              }}
              onMouseDown={handleSegDragStart(i, seg.dir)}
              onDoubleClick={handleSegDblClick(i)}
              title="Přetáhněte pro posun segmentu, dvojklik pro reset"
            />
          ))}
        </EdgeLabelRenderer>
      )}

      {/* Label (centered on path, draggable along path) */}
      {(selected || data?.label || isEditing) && (
        <EdgeLabelRenderer>
          <div
            className={`edge-label-container ${labelDragging ? 'label-dragging' : ''}`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelPos.x}px, ${labelPos.y}px)`,
            }}
            onMouseDown={handleLabelMouseDown}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="edge-input"
                placeholder="Popisek..."
              />
            ) : (
              <div
                className={`edge-label ${!data?.label ? 'empty' : ''}`}
                onDoubleClick={handleLabelDoubleClick}
              >
                {data?.label || ''}
              </div>
            )}
            {selected && !isEditing && (
              <button
                className="edge-style-toggle"
                onClick={toggleStyle}
                title={isDashed ? 'Plná čára' : 'Čárkovaná čára'}
              >
                {isDashed ? '┅' : '─'}
              </button>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
