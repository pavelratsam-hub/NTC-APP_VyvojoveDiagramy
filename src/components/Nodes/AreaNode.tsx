import { useState, useCallback, useRef, useEffect } from 'react'
import { useReactFlow, NodeResizer, type NodeProps } from '@xyflow/react'
import { COLOR_PAIRS, type DiagramNodeData } from '../../types/diagram'
import { useResizeModifiers } from '../../hooks/useResizeModifiers'
import './Nodes.css'

function AreaNode({ id, data, selected }: NodeProps<DiagramNodeData>) {
  const resizeMods = useResizeModifiers()
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [descText, setDescText] = useState(data.description ?? '')
  const descInputRef = useRef<HTMLInputElement>(null)
  const { setNodes } = useReactFlow()
  const colorPair = COLOR_PAIRS[data.colorIndex ?? 0]
  const showFill = data.showFill !== false
  const lineStyle = data.lineStyle ?? 'solid'
  const locked = data.locked ?? false

  useEffect(() => {
    if (isEditingDesc && descInputRef.current) {
      descInputRef.current.focus()
      descInputRef.current.select()
    }
  }, [isEditingDesc])

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

  const setColor = useCallback((colorIndex: number) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, colorIndex } } : node
      )
    )
  }, [id, setNodes])

  const toggleFill = useCallback(() => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, showFill: !showFill } } : node
      )
    )
  }, [id, setNodes, showFill])

  const toggleLock = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const newLocked = !locked
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              draggable: !newLocked,
              selectable: !newLocked,
              data: { ...node.data, locked: newLocked },
            }
          : node
      )
    )
  }, [id, setNodes, locked])

  const toggleLineStyle = useCallback(() => {
    const next = lineStyle === 'solid' ? 'dashed' : 'solid'
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, lineStyle: next } } : node
      )
    )
  }, [id, setNodes, lineStyle])

  return (
    <>
      <NodeResizer
        isVisible={selected && !locked}
        minWidth={100}
        minHeight={80}
        keepAspectRatio={resizeMods.keepAspectRatio}
        lineClassName="node-resizer-line"
        handleClassName="node-resizer-handle"
      />
      {(isEditingDesc || data.description || (selected && !locked)) && (
        <div
          className="node-description area-description"
          style={{ color: colorPair.stroke }}
          onDoubleClick={locked ? undefined : handleDescDoubleClick}
        >
          {isEditingDesc && !locked ? (
            <input
              ref={descInputRef}
              value={descText}
              onChange={(e) => setDescText(e.target.value)}
              onBlur={handleDescBlur}
              onKeyDown={handleDescKeyDown}
              className="node-description-input"
              style={{ color: colorPair.stroke }}
              placeholder="Popis oblasti..."
            />
          ) : (
            <span className={data.description ? '' : 'node-description-placeholder'}>
              {data.description || 'Popis oblasti...'}
            </span>
          )}
        </div>
      )}
      <div
        className="node-area"
        style={{
          borderColor: colorPair.stroke,
          borderStyle: lineStyle,
        }}
      >
        <div
          className="node-area-fill"
          style={{
            background: showFill ? colorPair.fill : 'transparent',
          }}
        />
        {locked && (
          <div
            className="node-area-lock-overlay"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
      <button
        className={`area-lock-icon ${locked ? 'locked' : ''}`}
        onClick={toggleLock}
        onMouseDown={(e) => e.stopPropagation()}
        title={locked ? 'Odemknout oblast' : 'Zamknout oblast'}
      >
        {locked ? '🔒' : '🔓'}
      </button>
      {selected && !locked && (
        <div className="area-controls">
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
          <div className="area-toggles">
            <button
              className={`area-toggle-btn ${showFill ? 'active' : ''}`}
              onClick={toggleFill}
              title={showFill ? 'Vypnout výplň' : 'Zapnout výplň'}
            >
              {showFill ? 'Výplň: ZAP' : 'Výplň: VYP'}
            </button>
            <button
              className={`area-toggle-btn ${lineStyle === 'dashed' ? 'active' : ''}`}
              onClick={toggleLineStyle}
              title={lineStyle === 'solid' ? 'Čárkovaná čára' : 'Plná čára'}
            >
              {lineStyle === 'solid' ? 'Čára: plná' : 'Čára: čárk.'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default AreaNode
