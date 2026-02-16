import { useState, useCallback, useRef, useEffect } from 'react'
import { Handle, Position, useReactFlow, NodeResizer, type NodeProps } from '@xyflow/react'
import { COLOR_PAIRS, type DiagramNode } from '../../types/diagram'
import { useResizeModifiers } from '../../hooks/useResizeModifiers'
import './Nodes.css'

function DecisionNode({ id, data, selected }: NodeProps<DiagramNode>) {
  const resizeMods = useResizeModifiers()
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(data.label)
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [descText, setDescText] = useState(data.description ?? '')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const descInputRef = useRef<HTMLInputElement>(null)
  const { setNodes } = useReactFlow()
  const colorPair = COLOR_PAIRS[data.colorIndex ?? 0]

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    if (isEditingDesc && descInputRef.current) {
      descInputRef.current.focus()
      descInputRef.current.select()
    }
  }, [isEditingDesc])

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, label: text } } : node
      )
    )
  }, [id, text, setNodes])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleBlur()
      }
      if (e.key === 'Escape') {
        setText(data.label)
        setIsEditing(false)
      }
    },
    [handleBlur, data.label]
  )

  const fontSize = data.fontSize ?? 14

  const setColor = useCallback((colorIndex: number) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, colorIndex } } : node
      )
    )
  }, [id, setNodes])

  const changeFontSize = useCallback((delta: number) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id !== id) return node
        const current = (node.data as typeof data).fontSize ?? 14
        const next = Math.max(8, Math.min(32, current + delta))
        return { ...node, data: { ...node.data, fontSize: next } }
      })
    )
  }, [id, setNodes])

  const handleDescDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditingDesc(true)
  }, [])

  const handleDescBlur = useCallback(() => {
    setIsEditingDesc(false)
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, description: descText } } : node
      )
    )
  }, [id, descText, setNodes])

  const handleDescKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleDescBlur()
      }
      if (e.key === 'Escape') {
        setDescText(data.description ?? '')
        setIsEditingDesc(false)
      }
    },
    [handleDescBlur, data.description]
  )

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={80}
        keepAspectRatio={resizeMods.keepAspectRatio}
        lineClassName="node-resizer-line"
        handleClassName="node-resizer-handle"
      />
      {(isEditingDesc || data.description || selected) && (
        <div className="node-description" onDoubleClick={handleDescDoubleClick}>
          {isEditingDesc ? (
            <input
              ref={descInputRef}
              value={descText}
              onChange={(e) => setDescText(e.target.value)}
              onBlur={handleDescBlur}
              onKeyDown={handleDescKeyDown}
              className="node-description-input"
              placeholder="Popis..."
            />
          ) : (
            <span className={data.description ? '' : 'node-description-placeholder'}>
              {data.description || 'Popis...'}
            </span>
          )}
        </div>
      )}
      <div className="node-decision-wrapper" onDoubleClick={handleDoubleClick}>
        <Handle type="target" position={Position.Top} id="top-target" className="handle-decision handle-top" />
        <Handle type="source" position={Position.Top} id="top-source" className="handle-decision handle-top" />
        <Handle type="target" position={Position.Left} id="left-target" className="handle-decision handle-left" />
        <Handle type="source" position={Position.Left} id="left-source" className="handle-decision handle-left" />
        <Handle type="target" position={Position.Right} id="right-target" className="handle-decision handle-right" />
        <Handle type="source" position={Position.Right} id="right-source" className="handle-decision handle-right" />
        <Handle type="target" position={Position.Bottom} id="bottom-target" className="handle-decision handle-bottom" />
        <Handle type="source" position={Position.Bottom} id="bottom-source" className="handle-decision handle-bottom" />
        <div
          className="node-decision-shape"
          style={{ '--diamond-fill': colorPair.fill, '--diamond-stroke': colorPair.stroke } as React.CSSProperties}
        ></div>
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="node-textarea node-textarea-decision"
            style={{ fontSize }}
          />
        ) : (
          <div className="node-decision-label" style={{ fontSize }}>
            {data.label}
          </div>
        )}
        {selected && (
          <>
            <div className="color-palette">
              {COLOR_PAIRS.map((cp, i) => (
                <button
                  key={i}
                  className={`color-swatch ${i === (data.colorIndex ?? 0) ? 'active' : ''}`}
                  style={{ background: cp.fill, borderColor: cp.stroke }}
                  onClick={() => setColor(i)}
                  title={`Barva ${i + 1}`}
                />
              ))}
            </div>
            <div className="font-size-controls">
              <button className="font-size-btn" onClick={() => changeFontSize(-2)} title="Zmenšit písmo">A−</button>
              <span className="font-size-value">{fontSize}</span>
              <button className="font-size-btn" onClick={() => changeFontSize(2)} title="Zvětšit písmo">A+</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default DecisionNode
