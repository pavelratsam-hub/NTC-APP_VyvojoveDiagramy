import { useState, useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  ConnectionMode,
  SelectionMode,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Panel,
  type Node,
  type Edge,
  type OnConnect,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

import Toolbar from './components/Toolbar/Toolbar'
import PaperBoundary from './components/Paper/PaperBoundary'
import { nodeTypes } from './components/Nodes/nodeTypes'
import { defaultEdgeOptions, edgeTypes } from './components/Edges/edgeTypes'
import type { PaperSettings } from './types/diagram'
import { PAPER_SIZES } from './types/diagram'
import './App.css'

const STORAGE_KEY = 'diagram-autosave'

const defaultNodes: Node[] = [
  {
    id: '1',
    type: 'startEnd',
    position: { x: 50, y: 50 },
    data: { label: 'Start' },
  },
]

const defaultEdges: Edge[] = []

const defaultPaperSettings: PaperSettings = {
  format: 'A4',
  width: PAPER_SIZES.A4.width,
  height: PAPER_SIZES.A4.height,
  orientation: 'portrait',
}

function loadFromStorage(): { nodes: Node[]; edges: Edge[]; paper: PaperSettings } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data && Array.isArray(data.nodes) && Array.isArray(data.edges) && data.paper) {
      return data
    }
  } catch {
    // corrupted data – ignore
  }
  return null
}

const saved = loadFromStorage()

const DEFAULT_SIZES: Record<string, { width: number; height: number }> = {
  action: { width: 120, height: 60 },
  decision: { width: 100, height: 100 },
  startEnd: { width: 120, height: 50 },
  area: { width: 200, height: 150 },
}

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(saved?.nodes ?? defaultNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(saved?.edges ?? defaultEdges)
  const { screenToFlowPosition } = useReactFlow()
  const [showGrid, setShowGrid] = useState(false)
  const [showPaper, setShowPaper] = useState(false)
  const [paperSettings, setPaperSettings] = useState<PaperSettings>(saved?.paper ?? defaultPaperSettings)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const dragStartScreen = useRef<{ x: number; y: number } | null>(null)
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null) // screen px

  // --- Undo history ---
  const MAX_HISTORY = 50
  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([])
  const isRestoringRef = useRef(false)
  const historyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSnapshotRef = useRef<string>('')

  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false
      return
    }
    if (historyTimer.current) clearTimeout(historyTimer.current)
    historyTimer.current = setTimeout(() => {
      const snapshot = JSON.stringify({ nodes, edges })
      if (snapshot !== lastSnapshotRef.current) {
        if (lastSnapshotRef.current) {
          historyRef.current.push(JSON.parse(lastSnapshotRef.current))
          if (historyRef.current.length > MAX_HISTORY) {
            historyRef.current.shift()
          }
        }
        lastSnapshotRef.current = snapshot
      }
    }, 300)
    return () => {
      if (historyTimer.current) clearTimeout(historyTimer.current)
    }
  }, [nodes, edges])

  const undo = useCallback(() => {
    const prev = historyRef.current.pop()
    if (!prev) return
    isRestoringRef.current = true
    lastSnapshotRef.current = JSON.stringify(prev)
    setNodes(prev.nodes)
    setEdges(prev.edges)
  }, [setNodes, setEdges])

  // --- Autosave s debounce 500ms ---
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const payload = JSON.stringify({ nodes, edges, paper: paperSettings })
      localStorage.setItem(STORAGE_KEY, payload)
    }, 500)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [nodes, edges, paperSettings])

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )

  // --- Export JSON ---
  const handleExport = useCallback(async () => {
    const data = JSON.stringify({ nodes, edges, paper: paperSettings }, null, 2)

    // File System Access API (Chrome/Edge) – uživatel si vybere umístění a název
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
          suggestedName: `diagram-${Date.now()}.json`,
          types: [
            {
              description: 'JSON soubor',
              accept: { 'application/json': ['.json'] },
            },
          ],
        })
        const writable = await handle.createWritable()
        await writable.write(data)
        await writable.close()
        return
      } catch (err) {
        // Uživatel zrušil dialog – nic nedělat
        if (err instanceof DOMException && err.name === 'AbortError') return
      }
    }

    // Fallback pro prohlížeče bez File System Access API (Firefox apod.)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diagram-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [nodes, edges, paperSettings])

  // --- Nová plocha ---
  const handleNewDiagram = useCallback(() => {
    const answer = window.confirm('Chcete před vymazáním exportovat diagram do JSON?')
    if (answer) {
      handleExport().then(() => {
        setNodes(defaultNodes)
        setEdges([])
        historyRef.current = []
        lastSnapshotRef.current = ''
        localStorage.removeItem(STORAGE_KEY)
      })
    } else {
      setNodes(defaultNodes)
      setEdges([])
      historyRef.current = []
      lastSnapshotRef.current = ''
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [handleExport, setNodes, setEdges])

  // --- Import JSON ---
  const handleImport = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result
        if (typeof text !== 'string') return
        const data = JSON.parse(text)
        if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges) || !data.paper) {
          alert('Neplatný formát souboru. Očekává se JSON s klíči: nodes, edges, paper.')
          return
        }
        setNodes(data.nodes)
        setEdges(data.edges)
        setPaperSettings(data.paper)
      } catch {
        alert('Chyba při čtení souboru. Ujistěte se, že se jedná o platný JSON.')
      }
    }
    reader.readAsText(file)
  }, [setNodes, setEdges])

  // --- Pomocná funkce: zachytí oblast papíru jako PNG dataUrl ---
  const MM_TO_PX = 3.78

  const capturePaperArea = useCallback((): Promise<string> => {
    const rfEl = document.querySelector('.react-flow') as HTMLElement | null
    if (!rfEl) return Promise.reject(new Error('ReactFlow element not found'))

    const paperW = paperSettings.orientation === 'portrait'
      ? paperSettings.width * MM_TO_PX
      : paperSettings.height * MM_TO_PX
    const paperH = paperSettings.orientation === 'portrait'
      ? paperSettings.height * MM_TO_PX
      : paperSettings.width * MM_TO_PX

    // Uložit vybrané prvky a odoznačit vše před exportem
    const selectedNodeIds = nodes.filter((n) => n.selected).map((n) => n.id)
    const selectedEdgeIds = edges.filter((e) => e.selected).map((e) => e.id)

    if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
      setEdges((eds) => eds.map((e) => ({ ...e, selected: false })))
    }

    // Počkat na překreslení DOM bez výběru
    return new Promise<string>((resolve, reject) => {
      requestAnimationFrame(() => {
        // html-to-image špatně zachytává SVG inline styly (stroke, stroke-width).
        // Řešení: nastavit stroke jako SVG atribut přímo na <path> elementech.
        const edgePaths = rfEl.querySelectorAll('.react-flow__edge-path')
        const originalAttrs: { el: Element; stroke: string | null; strokeWidth: string | null }[] = []
        edgePaths.forEach((path) => {
          originalAttrs.push({
            el: path,
            stroke: path.getAttribute('stroke'),
            strokeWidth: path.getAttribute('stroke-width'),
          })
          const computed = window.getComputedStyle(path)
          path.setAttribute('stroke', computed.stroke || '#333')
          path.setAttribute('stroke-width', computed.strokeWidth || '2')
        })

        toPng(rfEl, {
          quality: 1,
          pixelRatio: 2,
          width: paperW,
          height: paperH,
          backgroundColor: '#ffffff',
          filter: (node) => {
            if (node instanceof HTMLElement && node.classList) {
              if (
                node.classList.contains('react-flow__controls') ||
                node.classList.contains('react-flow__background') ||
                node.classList.contains('react-flow__minimap') ||
                node.classList.contains('react-flow__panel') ||
                node.classList.contains('react-flow__handle') ||
                node.classList.contains('react-flow__resize-control') ||
                node.classList.contains('area-lock-icon') ||
                node.classList.contains('area-controls') ||
                node.classList.contains('color-palette') ||
                node.classList.contains('node-resizer-handle') ||
                node.classList.contains('node-resizer-line')
              ) {
                return false
              }
            }
            return true
          },
        })
          .then(resolve)
          .catch(reject)
          .finally(() => {
            // Obnovit původní atributy
            originalAttrs.forEach(({ el, stroke, strokeWidth }) => {
              if (stroke === null) el.removeAttribute('stroke')
              else el.setAttribute('stroke', stroke)
              if (strokeWidth === null) el.removeAttribute('stroke-width')
              else el.setAttribute('stroke-width', strokeWidth)
            })
            // Obnovit výběr
            if (selectedNodeIds.length > 0) {
              setNodes((nds) =>
                nds.map((n) => selectedNodeIds.includes(n.id) ? { ...n, selected: true } : n)
              )
            }
            if (selectedEdgeIds.length > 0) {
              setEdges((eds) =>
                eds.map((e) => selectedEdgeIds.includes(e.id) ? { ...e, selected: true } : e)
              )
            }
          })
      })
    })
  }, [paperSettings, nodes, edges, setNodes, setEdges])

  // --- Export PNG ---
  const handleExportPNG = useCallback(() => {
    capturePaperArea()
      .then((dataUrl) => {
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `diagram-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      })
      .catch((err) => {
        console.error('PNG export failed:', err)
        alert('Export PNG se nezdařil.')
      })
  }, [capturePaperArea])

  // --- Export PDF ---
  const handleExportPDF = useCallback(() => {
    capturePaperArea()
      .then((dataUrl) => {
        const w = paperSettings.orientation === 'landscape' ? paperSettings.height : paperSettings.width
        const h = paperSettings.orientation === 'landscape' ? paperSettings.width : paperSettings.height
        const orientation = paperSettings.orientation === 'landscape' ? 'landscape' : 'portrait'
        const doc = new jsPDF({ orientation, unit: 'mm', format: [w, h] })
        doc.addImage(dataUrl, 'PNG', 0, 0, w, h)
        doc.save(`diagram-${Date.now()}.pdf`)
      })
      .catch((err) => {
        console.error('PDF export failed:', err)
        alert('Export PDF se nezdařil.')
      })
  }, [capturePaperArea, paperSettings])

  const createNode = useCallback((type: string, position: { x: number; y: number }, size?: { width: number; height: number }) => {
    const nodeLabels: Record<string, string> = {
      action: 'Akce',
      decision: 'Podmínka?',
      startEnd: 'Start/Konec',
    }
    const finalSize = size || DEFAULT_SIZES[type] || { width: 120, height: 60 }
    if (type === 'area') {
      const newNode: Node = {
        id: `${Date.now()}`,
        type: 'area',
        position,
        data: { label: '', showFill: true, lineStyle: 'solid' },
        style: { width: finalSize.width, height: finalSize.height },
        zIndex: -1,
      }
      setNodes((nds) => [...nds, newNode])
      return
    }
    const newNode: Node = {
      id: `${Date.now()}`,
      type,
      position,
      data: { label: nodeLabels[type] || 'Node' },
      ...(size ? { style: { width: size.width, height: size.height } } : {}),
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  // --- Click-to-place: native DOM events on canvas container ---
  const canvasRef = useRef<HTMLDivElement>(null)
  const activeToolRef = useRef(activeTool)
  activeToolRef.current = activeTool

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return

    const onMouseDown = (event: MouseEvent) => {
      if (!activeToolRef.current) return
      const target = event.target as HTMLElement
      if (!target.closest('.react-flow__pane')) return
      const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      dragStart.current = flowPos
      const rect = el.getBoundingClientRect()
      dragStartScreen.current = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!activeToolRef.current || !dragStart.current) return
      const rect = el.getBoundingClientRect()
      const sx = event.clientX - rect.left
      const sy = event.clientY - rect.top
      const startScreen = dragStartScreen.current
      if (!startScreen) return
      const dx = Math.abs(sx - startScreen.x)
      const dy = Math.abs(sy - startScreen.y)
      if (dx > 5 || dy > 5) {
        setDragPreview({
          x: Math.min(startScreen.x, sx),
          y: Math.min(startScreen.y, sy),
          width: dx,
          height: dy,
        })
      }
    }

    const onMouseUp = (event: MouseEvent) => {
      if (!activeToolRef.current || !dragStart.current) return
      const endPos = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const dx = Math.abs(endPos.x - dragStart.current.x)
      const dy = Math.abs(endPos.y - dragStart.current.y)

      if (dx < 10 && dy < 10) {
        const defSize = DEFAULT_SIZES[activeToolRef.current] || { width: 120, height: 60 }
        createNode(activeToolRef.current, {
          x: dragStart.current.x - defSize.width / 2,
          y: dragStart.current.y - defSize.height / 2,
        })
      } else {
        const x = Math.min(dragStart.current.x, endPos.x)
        const y = Math.min(dragStart.current.y, endPos.y)
        createNode(activeToolRef.current, { x, y }, { width: dx, height: dy })
      }

      dragStart.current = null
      dragStartScreen.current = null
      setDragPreview(null)
      setActiveTool(null)
    }

    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mouseup', onMouseUp)
    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseup', onMouseUp)
    }
  }, [screenToFlowPosition, createNode])

  // --- Copy & Paste (Ctrl+C / Ctrl+V) ---
  const clipboard = useRef<Node[]>([])
  const pasteCount = useRef(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC – cancel active tool
      if (e.key === 'Escape' && activeTool) {
        setActiveTool(null)
        return
      }

      // Ignore when typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        undo()
        return
      }

      if (e.ctrlKey && e.key === 'c') {
        const selected = nodes.filter((n) => n.selected)
        if (selected.length === 0) return
        clipboard.current = selected.map((n) => structuredClone(n))
        pasteCount.current = 0
      }

      if (e.ctrlKey && e.key === 'v') {
        if (clipboard.current.length === 0) return
        e.preventDefault()
        pasteCount.current += 1
        const offset = pasteCount.current * 20

        const newNodes = clipboard.current.map((n) => ({
          ...structuredClone(n),
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          position: { x: n.position.x + offset, y: n.position.y + offset },
          selected: true,
        }))

        setNodes((nds) =>
          nds.map((n) => ({ ...n, selected: false })).concat(newNodes)
        )
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTool, nodes, setNodes, undo])

  return (
    <div className="app-container">
      <Toolbar
        activeTool={activeTool}
        onSetTool={setActiveTool}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        paperSettings={paperSettings}
        onPaperChange={setPaperSettings}
        showPaper={showPaper}
        onTogglePaper={() => setShowPaper(!showPaper)}
        onNewDiagram={handleNewDiagram}
        onExport={handleExport}
        onImport={handleImport}
        onExportPNG={handleExportPNG}
        onExportPDF={handleExportPDF}
      />
      <div ref={canvasRef} className={`canvas-container${activeTool ? ' tool-active' : ''}`}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          connectionMode={ConnectionMode.Loose}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          deleteKeyCode={['Backspace', 'Delete']}
          selectionOnDrag={!activeTool}
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode="Shift"
          panOnDrag={activeTool ? false : [1, 2]}
          zoomOnDoubleClick={false}
        >
          <Controls />
          {showGrid && <Background variant={BackgroundVariant.Dots} gap={20} size={1} />}
          <Panel position="top-left" style={{ margin: 0, padding: 0 }}>
            <PaperBoundary settings={paperSettings} visible={showPaper} />
          </Panel>
        </ReactFlow>
        {dragPreview && (
          <div
            className="drag-preview"
            style={{
              left: dragPreview.x,
              top: dragPreview.y,
              width: dragPreview.width,
              height: dragPreview.height,
            }}
          />
        )}
      </div>
    </div>
  )
}

export default App
