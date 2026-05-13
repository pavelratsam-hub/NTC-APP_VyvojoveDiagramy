import { useState, useCallback, useRef, useEffect } from 'react'
import { Handle, Position, useReactFlow, NodeResizer, type NodeProps } from '@xyflow/react'
import { COLOR_PAIRS, type DiagramNode } from '../../types/diagram'
import { useResizeModifiers } from '../../hooks/useResizeModifiers'
import { ConnectHandle } from './ConnectHandle'
import './Nodes.css'

function ActionNode({ id, data, selected }: NodeProps<DiagramNode>) {
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
    if (isEditing && inputRef.current) inputRef.current.focus()
    setNodes(nds => nds.map(n => n.id === id ? { ...n, draggable: !isEditing } : n))
  }, [isEditing, id, setNodes])

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
  const done = data.done ?? false
  const showDoneCheckbox = data.showDoneCheckbox ?? true
  const GREEN_COLOR_INDEX = 2

  const toggleDone = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setNodes(nodes => nodes.map(node => {
      if (node.id !== id) return node
      const becomingDone = !done
      return {
        ...node,
        data: {
          ...node.data,
          done: becomingDone,
          colorIndex: becomingDone ? GREEN_COLOR_INDEX : ((node.data.previousColorIndex as number) ?? 0),
          previousColorIndex: becomingDone ? (node.data.colorIndex ?? 0) : undefined,
        },
      }
    }))
  }, [id, setNodes, done])

  const setColor = useCallback((colorIndex: number) => {
    setNodes(nodes => nodes.map(n =>
      (n.id === id || (n.selected && n.type === 'action'))
        ? { ...n, data: { ...n.data, colorIndex } }
        : n
    ))
  }, [id, setNodes])

  const changeFontSize = useCallback((delta: number) => {
    setNodes(nodes => nodes.map(n => {
      if (n.id !== id) return n
      const current = (n.data as typeof data).fontSize ?? 14
      return { ...n, data: { ...n.data, fontSize: Math.max(8, Math.min(32, current + delta)) } }
    }))
  }, [id, setNodes])

  const toggleShowDoneCheckbox = useCallback(() => {
    setNodes(nodes => nodes.map(n =>
      n.id === id ? { ...n, data: { ...n.data, showDoneCheckbox: !showDoneCheckbox } } : n
    ))
  }, [id, setNodes, showDoneCheckbox])

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
        minHeight={40}
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
              onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation() }}
              className="node-description-input nodrag"
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
        className="node-action"
        style={{ background: colorPair.fill, borderColor: colorPair.stroke }}
      >
        {showDoneCheckbox && (
          <div
            className={`node-done-checkbox ${done ? 'checked' : ''}`}
            onClick={toggleDone}
            title={done ? 'Hotovo – klikni pro zrušení' : 'Klikni pro označení jako hotovo'}
          >
            {done && <span>✓</span>}
          </div>
        )}
        <Handle type="target" position={Position.Top} id="top-target" />
        <Handle type="source" position={Position.Top} id="top-source" />
        <Handle type="target" position={Position.Left} id="left-target" />
        <Handle type="source" position={Position.Left} id="left-source" />
        <Handle type="target" position={Position.Right} id="right-target" />
        <Handle type="source" position={Position.Right} id="right-source" />
        <Handle type="target" position={Position.Bottom} id="bottom-target" />
        <Handle type="source" position={Position.Bottom} id="bottom-source" />
        <ConnectHandle nodeId={id} position="top" />
        <ConnectHandle nodeId={id} position="bottom" />
        <ConnectHandle nodeId={id} position="left" />
        <ConnectHandle nodeId={id} position="right" />
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation() }}
            className="node-textarea nodrag"
            style={{ fontSize }}
          />
        ) : (
          <div
            className={`node-label${selected ? ' clickable' : ''}`}
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
                <div className="nsp-row">
                  <button
                    className={`nsp-toggle${showDoneCheckbox ? ' active' : ''}`}
                    onClick={toggleShowDoneCheckbox}
                  >
                    {showDoneCheckbox ? '☑ Checkbox' : '☐ Checkbox'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default ActionNode
