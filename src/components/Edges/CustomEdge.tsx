import { useState, useCallback, useRef, useEffect } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react'
import type { DiagramEdgeData } from '../../types/diagram'
import './Edges.css'

export function StraightEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
  data,
  markerEnd,
}: EdgeProps<DiagramEdgeData>) {
  const [isEditing, setIsEditing] = useState(false)
  const [labelText, setLabelText] = useState(data?.label || '')
  const inputRef = useRef<HTMLInputElement>(null)
  const { setEdges } = useReactFlow()

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
  }, [])

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
      if (e.key === 'Enter') {
        handleBlur()
      }
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

  const isDashed = data?.lineStyle === 'dashed'

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeDasharray: isDashed ? '5,5' : 'none',
        }}
      />
      {(selected || data?.label || isEditing) && (
        <EdgeLabelRenderer>
          <div
            className="edge-label-container"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
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
                onDoubleClick={handleDoubleClick}
              >
                {data?.label || ''}
              </div>
            )}
            {selected && (
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
