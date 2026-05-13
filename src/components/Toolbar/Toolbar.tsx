import { useRef, useState } from 'react'
import type { PaperSettings, PaperFormat } from '../../types/diagram'
import { PAPER_SIZES } from '../../types/diagram'
import './Toolbar.css'

interface ToolbarProps {
  activeTool: string | null
  onSetTool: (type: string | null) => void
  showGrid: boolean
  onToggleGrid: () => void
  paperSettings: PaperSettings
  onPaperChange: (settings: PaperSettings) => void
  showPaper: boolean
  onTogglePaper: () => void
  onNewDiagram: () => void
  onExport: () => void
  onImport: (file: File) => void
  onExportPNG: () => void
  onExportPDF: () => void
  onExportSVG: () => void
  serverStatus: 'idle' | 'saving' | 'saved' | 'error'
  currentServerName: string | null
  onSaveToServer: () => void
  onOpenServerModal: () => void
  mobileOpen?: boolean
}

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="tb-section">
      <button className="tb-section-header" onClick={onToggle}>
        <span>{title}</span>
        <span className={`tb-chevron${open ? ' open' : ''}`}>▾</span>
      </button>
      {open && <div className="tb-section-body">{children}</div>}
    </div>
  )
}

function Toolbar({
  activeTool,
  onSetTool,
  showGrid,
  onToggleGrid,
  paperSettings,
  onPaperChange,
  showPaper,
  onTogglePaper,
  onNewDiagram,
  onExport,
  onImport,
  onExportPNG,
  onExportPDF,
  onExportSVG,
  serverStatus,
  currentServerName,
  onSaveToServer,
  onOpenServerModal,
  mobileOpen,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState({
    tvary: true,
    zobrazeni: false,
    papir: false,
    server: true,
    soubor: false,
  })

  const toggle = (key: keyof typeof open) =>
    setOpen(prev => ({ ...prev, [key]: !prev[key] }))

  const handleFormatChange = (format: PaperFormat) => {
    const size = PAPER_SIZES[format]
    onPaperChange({ ...paperSettings, format, width: size.width, height: size.height })
  }

  const handleOrientationToggle = () => {
    onPaperChange({
      ...paperSettings,
      orientation: paperSettings.orientation === 'portrait' ? 'landscape' : 'portrait',
    })
  }

  const handleCustomSize = (dimension: 'width' | 'height', value: string) => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num > 0) {
      onPaperChange({ ...paperSettings, format: 'custom', [dimension]: num })
    }
  }

  const shapes = [
    { type: 'action',   label: 'Akce',       cls: 'shape-action' },
    { type: 'decision', label: 'Podmínka',    cls: 'shape-decision' },
    { type: 'startEnd', label: 'Start/Konec', cls: 'shape-startend' },
    { type: 'area',     label: 'Oblast',      cls: 'shape-area' },
  ]

  return (
    <div className={`toolbar${mobileOpen ? ' mobile-open' : ''}`}>
      <button className="tb-top-btn" onClick={onNewDiagram}>+ Nová plocha</button>

      <Section title="Tvary" open={open.tvary} onToggle={() => toggle('tvary')}>
        <div className="tb-shapes-grid">
          {shapes.map(s => (
            <button
              key={s.type}
              className={`tb-shape-btn${activeTool === s.type ? ' active' : ''}`}
              onClick={() => onSetTool(activeTool === s.type ? null : s.type)}
              title={s.label}
            >
              <div className={`shape-preview ${s.cls}`} />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Zobrazení" open={open.zobrazeni} onToggle={() => toggle('zobrazeni')}>
        <button className={`tb-btn${showGrid ? ' active' : ''}`} onClick={onToggleGrid}>
          {showGrid ? 'Skrýt mřížku' : 'Zobrazit mřížku'}
        </button>
        <button className={`tb-btn${showPaper ? ' active' : ''}`} onClick={onTogglePaper}>
          {showPaper ? 'Skrýt papír' : 'Zobrazit papír'}
        </button>
      </Section>

      <Section title="Formát papíru" open={open.papir} onToggle={() => toggle('papir')}>
        <div className="tb-row">
          {(['A4', 'A5', 'custom'] as PaperFormat[]).map(fmt => (
            <button
              key={fmt}
              className={`tb-btn-sm${paperSettings.format === fmt ? ' active' : ''}`}
              onClick={() => handleFormatChange(fmt)}
            >
              {fmt === 'custom' ? 'Vlast.' : fmt}
            </button>
          ))}
        </div>
        <button className="tb-btn" onClick={handleOrientationToggle}>
          {paperSettings.orientation === 'portrait' ? '↕ Na výšku' : '↔ Na šířku'}
        </button>
        {paperSettings.format === 'custom' && (
          <div className="tb-inputs">
            <label>
              Šířka (mm)
              <input
                type="number"
                value={paperSettings.width}
                onChange={e => handleCustomSize('width', e.target.value)}
                min="50" max="1000"
              />
            </label>
            <label>
              Výška (mm)
              <input
                type="number"
                value={paperSettings.height}
                onChange={e => handleCustomSize('height', e.target.value)}
                min="50" max="1000"
              />
            </label>
          </div>
        )}
      </Section>

      <Section title="Server" open={open.server} onToggle={() => toggle('server')}>
        {currentServerName && (
          <div className="tb-server-name" title={currentServerName}>{currentServerName}</div>
        )}
        <button
          className={`tb-btn server-save-btn${serverStatus === 'saved' ? ' saved' : serverStatus === 'error' ? ' error' : ''}`}
          onClick={onSaveToServer}
          disabled={serverStatus === 'saving'}
        >
          {serverStatus === 'saving' ? '⏳ Ukládám…'
            : serverStatus === 'saved' ? '✓ Uloženo'
            : serverStatus === 'error' ? '✗ Chyba'
            : currentServerName ? '☁ Přeuložit' : '☁ Uložit na server'}
        </button>
        <button className="tb-btn" onClick={onOpenServerModal}>☁ Načíst / Správa</button>
      </Section>

      <Section title="Soubor" open={open.soubor} onToggle={() => toggle('soubor')}>
        <button className="tb-btn" onClick={onExportPNG}>Export PNG</button>
        <button className="tb-btn" onClick={onExportPDF}>Export PDF</button>
        <button className="tb-btn" onClick={onExportSVG}>Export SVG</button>
        <button className="tb-btn" onClick={onExport}>Export JSON</button>
        <button className="tb-btn" onClick={() => fileInputRef.current?.click()}>Import JSON</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden-file-input"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) { onImport(file); e.target.value = '' }
          }}
        />
      </Section>
    </div>
  )
}

export default Toolbar
