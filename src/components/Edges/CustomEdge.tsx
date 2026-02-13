import { useState, useCallback, useRef, useEffect } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  useReactFlow,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react'
import type { DiagramEdge } from '../../types/diagram'
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
  markerStart,
}: EdgeProps<DiagramEdge>) {
  const [isEditing, setIsEditing] = useState(false)
  const [labelText, setLabelText] = useState(data?.label || '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { setEdges } = useReactFlow()

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  })

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
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
      if (e.key === 'Enter' && e.altKey) {
        e.preventDefault()
        const ta = e.target as HTMLTextAreaElement
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const newText = labelText.slice(0, start) + '\n' + labelText.slice(end)
        setLabelText(newText)
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 1
        })
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        handleBlur()
      }
      if (e.key === 'Escape') {
        setLabelText(data?.label || '')
        setIsEditing(false)
      }
    },
    [handleBlur, data?.label, labelText]
  )

  const reverseEdge = useCallback(() => {
    setEdges((edges) =>
      edges.map((edge) =>
        edge.id === id
          ? {
              ...edge,
              markerEnd: edge.markerStart || undefined,
              markerStart: edge.markerEnd || undefined,
            }
          : edge
      )
    )
  }, [id, setEdges])

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
        markerStart={markerStart}
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
            {selected && !isEditing && (
              <div className="edge-buttons">
                <button
                  className="edge-style-toggle"
                  onClick={reverseEdge}
                  title="Otočit směr šipky"
                >
                  ⇄
                </button>
                <button
                  className="edge-style-toggle"
                  onClick={toggleStyle}
                  title={isDashed ? 'Plná čára' : 'Čárkovaná čára'}
                >
                  {isDashed ? '┅' : '─'}
                </button>
              </div>
            )}
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="edge-textarea"
                placeholder="Popisek..."
                rows={Math.max(1, labelText.split('\n').length)}
              />
            ) : (
              <div
                className={`edge-label ${!data?.label ? 'empty' : ''}`}
                onDoubleClick={handleDoubleClick}
              >
                {data?.label || ''}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
