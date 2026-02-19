import { useRef } from 'react'
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
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFormatChange = (format: PaperFormat) => {
    const size = PAPER_SIZES[format]
    onPaperChange({
      ...paperSettings,
      format,
      width: size.width,
      height: size.height,
    })
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
      onPaperChange({
        ...paperSettings,
        format: 'custom',
        [dimension]: num,
      })
    }
  }

  return (
    <div className="toolbar">
      <h2 className="toolbar-title">Nástroje</h2>

      <button className="toolbar-btn" onClick={onNewDiagram}>
        <span>Nová plocha</span>
      </button>

      <div className="toolbar-section">
        <h3>Tvary</h3>
        <button
          className={`toolbar-btn${activeTool === 'action' ? ' active' : ''}`}
          onClick={() => onSetTool(activeTool === 'action' ? null : 'action')}
          title="Akce (obdélník) – klikni a pak klikni na plátno"
        >
          <div className="shape-preview shape-action"></div>
          <span>Akce</span>
        </button>

        <button
          className={`toolbar-btn${activeTool === 'decision' ? ' active' : ''}`}
          onClick={() => onSetTool(activeTool === 'decision' ? null : 'decision')}
          title="Podmínka (kosočtverec) – klikni a pak klikni na plátno"
        >
          <div className="shape-preview shape-decision"></div>
          <span>Podmínka</span>
        </button>

        <button
          className={`toolbar-btn${activeTool === 'startEnd' ? ' active' : ''}`}
          onClick={() => onSetTool(activeTool === 'startEnd' ? null : 'startEnd')}
          title="Start/Konec (zaoblený) – klikni a pak klikni na plátno"
        >
          <div className="shape-preview shape-startend"></div>
          <span>Start/Konec</span>
        </button>
      </div>

      <div className="toolbar-section">
        <h3>Oblasti</h3>
        <button
          className={`toolbar-btn${activeTool === 'area' ? ' active' : ''}`}
          onClick={() => onSetTool(activeTool === 'area' ? null : 'area')}
          title="Oblast (obdélník) – klikni a pak klikni na plátno"
        >
          <div className="shape-preview shape-area"></div>
          <span>Obdélník</span>
        </button>
      </div>

      <div className="toolbar-section">
        <h3>Zobrazení</h3>
        <button
          className={`toolbar-btn ${showGrid ? 'active' : ''}`}
          onClick={onToggleGrid}
        >
          <span>{showGrid ? 'Skrýt mřížku' : 'Zobrazit mřížku'}</span>
        </button>
        <button
          className={`toolbar-btn ${showPaper ? 'active' : ''}`}
          onClick={onTogglePaper}
        >
          <span>{showPaper ? 'Skrýt papír' : 'Zobrazit papír'}</span>
        </button>
      </div>

      <div className="toolbar-section">
        <h3>Formát papíru</h3>
        <div className="toolbar-row">
          <button
            className={`toolbar-btn-small ${paperSettings.format === 'A4' ? 'active' : ''}`}
            onClick={() => handleFormatChange('A4')}
          >
            A4
          </button>
          <button
            className={`toolbar-btn-small ${paperSettings.format === 'A5' ? 'active' : ''}`}
            onClick={() => handleFormatChange('A5')}
          >
            A5
          </button>
          <button
            className={`toolbar-btn-small ${paperSettings.format === 'custom' ? 'active' : ''}`}
            onClick={() => handleFormatChange('custom')}
          >
            Vlastní
          </button>
        </div>

        <button
          className="toolbar-btn"
          onClick={handleOrientationToggle}
        >
          <span>{paperSettings.orientation === 'portrait' ? '↕ Na výšku' : '↔ Na šířku'}</span>
        </button>

        {paperSettings.format === 'custom' && (
          <div className="toolbar-inputs">
            <label>
              <span>Šířka (mm)</span>
              <input
                type="number"
                value={paperSettings.width}
                onChange={(e) => handleCustomSize('width', e.target.value)}
                min="50"
                max="1000"
              />
            </label>
            <label>
              <span>Výška (mm)</span>
              <input
                type="number"
                value={paperSettings.height}
                onChange={(e) => handleCustomSize('height', e.target.value)}
                min="50"
                max="1000"
              />
            </label>
          </div>
        )}
      </div>

      <div className="toolbar-section">
        <h3>Soubor</h3>
        <button className="toolbar-btn" onClick={onExportPNG}>
          <span>Export PNG</span>
        </button>
        <button className="toolbar-btn" onClick={onExportPDF}>
          <span>Export PDF</span>
        </button>
        <button className="toolbar-btn" onClick={onExportSVG}>
          <span>Export SVG (vektory)</span>
        </button>
        <button className="toolbar-btn" onClick={onExport}>
          <span>Exportovat JSON</span>
        </button>
        <button
          className="toolbar-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <span>Importovat JSON</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden-file-input"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              onImport(file)
              e.target.value = ''
            }
          }}
        />
      </div>
    </div>
  )
}

export default Toolbar
