import { useState, useCallback, useRef, useEffect } from 'react'
import { Handle, Position, useReactFlow, NodeResizer, type NodeProps } from '@xyflow/react'
import { COLOR_PAIRS, type DiagramNode } from '../../types/diagram'
import { useResizeModifiers } from '../../hooks/useResizeModifiers'
import { ConnectHandle } from './ConnectHandle'
import './Nodes.css'

function DecisionNode({ id, data, selected }: NodeProps<DiagramNode>) {
  const resizeMods = useResizeModifiers()
  const [isEditing, setIsEditing] = useState(false)
  const [text, setText] = useState(data.label)
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [descText, setDescText] = useState(data.description ?? '')
  const [showSettings, setShowSettings] = useState(false)
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

  useEffect(() => {
    if (!selected) setShowSettings(false)
  }, [selected])

  const stopPointer = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
  }, [])

  const handleLabelClick = useCallback((e: React.MouseEvent) => {
    if (!selected) return
    e.stopPropagation()
    setIsEditing(true)
  }, [selected])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    setNodes(nodes => nodes.map(n => n.id === id ? { ...n, data: { ...n.data, label: text } } : n))
  }, [id, text, setNodes])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleBlur() }
    if (e.key === 'Escape') { setText(data.label); setIsEditing(false) }
  }, [handleBlur, data.label])

  const fontSize = data.fontSize ?? 14

  const setColor = useCallback((colorIndex: number) => {
    setNodes(nodes => nodes.map(n =>
      n.id === id ? { ...n, data: { ...n.data, colorIndex } } : n
    ))
  }, [id, setNodes])

  const changeFontSize = useCallback((delta: number) => {
    setNodes(nodes => nodes.map(n => {
      if (n.id !== id) return n
      const current = (n.data as typeof data).fontSize ?? 14
      return { ...n, data: { ...n.data, fontSize: Math.max(8, Math.min(32, current + delta)) } }
    }))
  }, [id, setNodes])

  const handleDescClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditingDesc(true)
  }, [])

  const handleDescBlur = useCallback(() => {
    setIsEditingDesc(false)
    setNodes(nodes => nodes.map(n =>
      n.id === id ? { ...n, data: { ...n.data, description: descText } } : n
    ))
  }, [id, descText, setNodes])

  const handleDescKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleDescBlur() }
    if (e.key === 'Escape') { setDescText(data.description ?? ''); setIsEditingDesc(false) }
  }, [handleDescBlur, data.description])

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
        <div
          className="node-description"
          onClick={!isEditingDesc ? handleDescClick : undefined}
          onPointerDown={stopPointer}
        >
          {isEditingDesc ? (
            <input
              ref={descInputRef}
              value={descText}
              onChange={e => setDescText(e.target.value)}
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
      <div className="node-decision-wrapper">
        <Handle type="target" position={Position.Top} id="top-target" className="handle-decision handle-top" />
        <Handle type="source" position={Position.Top} id="top-source" className="handle-decision handle-top" />
        <Handle type="target" position={Position.Left} id="left-target" className="handle-decision handle-left" />
        <Handle type="source" position={Position.Left} id="left-source" className="handle-decision handle-left" />
        <Handle type="target" position={Position.Right} id="right-target" className="handle-decision handle-right" />
        <Handle type="source" position={Position.Right} id="right-source" className="handle-decision handle-right" />
        <Handle type="target" position={Position.Bottom} id="bottom-target" className="handle-decision handle-bottom" />
        <Handle type="source" position={Position.Bottom} id="bottom-source" className="handle-decision handle-bottom" />
        <ConnectHandle nodeId={id} position="top" />
        <ConnectHandle nodeId={id} position="bottom" />
        <ConnectHandle nodeId={id} position="left" />
        <ConnectHandle nodeId={id} position="right" />
        <div
          className="node-decision-shape"
          style={{ '--diamond-fill': colorPair.fill, '--diamond-stroke': colorPair.stroke } as React.CSSProperties}
        />
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="node-textarea node-textarea-decision"
            style={{ fontSize }}
          />
        ) : (
          <div
            className={`node-decision-label${selected ? ' clickable' : ''}`}
            style={{ fontSize }}
            onClick={handleLabelClick}
          >
            {data.label}
          </div>
        )}
        {selected && (
          <>
            <button
              className={`node-settings-btn nodrag${showSettings ? ' active' : ''}`}
              onPointerDown={stopPointer}
              onClick={(e) => { e.stopPropagation(); setShowSettings(s => !s) }}
              title="Nastavení"
            >
              ⚙
            </button>
            {showSettings && (
              <div
                className="node-settings-panel nodrag"
                onPointerDown={stopPointer}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="nsp-colors">
                  {COLOR_PAIRS.map((cp, i) => (
                    <button
                      key={i}
                      className={`nsp-swatch${i === (data.colorIndex ?? 0) ? ' active' : ''}`}
                      style={{ background: cp.fill, borderColor: cp.stroke }}
                      onClick={() => setColor(i)}
                    />
                  ))}
                </div>
                <div className="nsp-fontsize">
                  <button className="nsp-btn" onClick={() => changeFontSize(-2)}>A−</button>
                  <span className="nsp-value">{fontSize}</span>
                  <button className="nsp-btn" onClick={() => changeFontSize(2)}>A+</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default DecisionNode
