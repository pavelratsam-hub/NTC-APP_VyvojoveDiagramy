import type { PaperSettings } from '../../types/diagram'
import './Paper.css'

interface PaperBoundaryProps {
  settings: PaperSettings
  visible: boolean
}

// Převod mm na pixely (při 96 DPI: 1mm = 3.78px, použijeme zaokrouhlení)
const MM_TO_PX = 3.78

function PaperBoundary({ settings, visible }: PaperBoundaryProps) {
  if (!visible) return null

  const width = settings.orientation === 'portrait'
    ? settings.width * MM_TO_PX
    : settings.height * MM_TO_PX

  const height = settings.orientation === 'portrait'
    ? settings.height * MM_TO_PX
    : settings.width * MM_TO_PX

  return (
    <div
      className="paper-boundary"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <div className="paper-label">
        {settings.format} - {settings.orientation === 'portrait' ? 'Na výšku' : 'Na šířku'}
        <span className="paper-size">({settings.width} × {settings.height} mm)</span>
      </div>
    </div>
  )
}

export default PaperBoundary
