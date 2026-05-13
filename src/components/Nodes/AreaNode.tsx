import { useState, useCallback, useRef, useEffect } from 'react'
import { useReactFlow, NodeResizer, type NodeProps } from '@xyflow/react'
import { COLOR_PAIRS, type DiagramNode } from '../../types/diagram'
import { useResizeModifiers } from '../../hooks/useResizeModifiers'
import './Nodes.css'

function AreaNode({ id, data, selected }: NodeProps<DiagramNode>) {
  const resizeMods = useResizeModifiers()
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [descText, setDescText] = useState(data.description ?? '')
  const [showSettings, setShowSettings] = useState(false)
  const descInputRef = useRef<HTMLInputElement>(null)
  const { setNodes, deleteElements } = useReactFlow()
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

  useEffect(() => {
    if (!selected) setShowSettings(false)
  }, [selected])

  const stopPointer = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
  }, [])

  const handleDescClick = useCallback((e: React.MouseEvent) => {
    if (locked) return
    e.stopPropagation()
    setIsEditingDesc(true)
  }, [locked])

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

  const setColor = useCallback((colorIndex: number) => {
    setNodes(nodes => nodes.map(n =>
      n.id === id ? { ...n, data: { ...n.data, colorIndex } } : n
    ))
  }, [id, setNodes])

  const toggleFill = useCallback(() => {
    setNodes(nodes => nodes.map(n =>
      n.id === id ? { ...n, data: { ...n.data, showFill: !showFill } } : n
    ))
  }, [id, setNodes, showFill])

  const toggleLock = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const newLocked = !locked
    setNodes(nodes => nodes.map(n =>
      n.id === id
        ? { ...n, draggable: !newLocked, selectable: !newLocked, data: { ...n.data, locked: newLocked } }
        : n
    ))
  }, [id, setNodes, locked])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    deleteElements({ nodes: [{ id }] })
  }, [id, deleteElements])

  const toggleLineStyle = useCallback(() => {
    const next = lineStyle === 'solid' ? 'dashed' : 'solid'
    setNodes(nodes => nodes.map(n =>
      n.id === id ? { ...n, data: { ...n.data, lineStyle: next } } : n
    ))
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
          onClick={!isEditingDesc ? handleDescClick : undefined}
          onPointerDown={stopPointer}
        >
          {isEditingDesc && !locked ? (
            <input
              ref={descInputRef}
              value={descText}
              onChange={e => setDescText(e.target.value)}
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
        style={{ borderColor: colorPair.stroke, borderStyle: lineStyle }}
      >
        <div
          className="node-area-fill"
          style={{ background: showFill ? colorPair.fill : 'transparent' }}
        />
        {locked && (
          <div
            className="node-area-lock-overlay"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>

      {/* Lock ikona: viditelná při selection nebo při zamčení */}
      <button
        className={`area-lock-icon${locked ? ' locked' : ''}`}
        onClick={toggleLock}
        onMouseDown={(e) => e.stopPropagation()}
        title={locked ? 'Odemknout oblast' : 'Zamknout oblast'}
      >
        {locked ? '🔒' : '🔓'}
      </button>

      {/* Settings panel pro oblast (barvy, výplň, čára) */}
      {selected && !locked && (
        <>
          <button
            className={`node-settings-btn nodrag${showSettings ? ' active' : ''}`}
            onPointerDown={stopPointer}
            onClick={(e) => { e.stopPropagation(); setShowSettings(s => !s) }}
            title="Nastavení"
          >
            ⚙
          </button>
          <button
            className="node-delete-btn nodrag"
            onPointerDown={stopPointer}
            onClick={handleDelete}
            title="Smazat"
          >
            🗑
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
              <div className="nsp-row">
                <button
                  className={`nsp-toggle${showFill ? ' active' : ''}`}
                  onClick={toggleFill}
                >
                  {showFill ? 'Výplň: ZAP' : 'Výplň: VYP'}
                </button>
                <button
                  className={`nsp-toggle${lineStyle === 'dashed' ? ' active' : ''}`}
                  onClick={toggleLineStyle}
                >
                  {lineStyle === 'solid' ? 'Čára: plná' : 'Čára: čárk.'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

export default AreaNode
