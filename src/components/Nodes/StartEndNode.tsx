import { useState, useCallback, useRef, useEffect } from 'react'
import { Handle, Position, useReactFlow, NodeResizer, type NodeProps } from '@xyflow/react'
import { COLOR_PAIRS, type DiagramNodeData } from '../../types/diagram'
import { useResizeModifiers } from '../../hooks/useResizeModifiers'
import './Nodes.css'

function StartEndNode({ id, data, selected }: NodeProps<DiagramNodeData>) {
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

  const setColor = useCallback((colorIndex: number) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, colorIndex } } : node
      )
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
        minHeight={40}
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
      <div
        className="node-startend"
        onDoubleClick={handleDoubleClick}
        style={{ background: colorPair.fill, borderColor: colorPair.stroke }}
      >
        <Handle type="target" position={Position.Top} id="top" />
        <Handle type="target" position={Position.Left} id="left" />
        <Handle type="source" position={Position.Right} id="right" />
        <Handle type="source" position={Position.Bottom} id="bottom" />
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="node-textarea"
          />
        ) : (
          <div className="node-label">
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
          </>
        )}
      </div>
    </>
  )
}

export default StartEndNode
