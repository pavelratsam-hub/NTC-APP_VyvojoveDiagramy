import { useContext, useRef } from 'react'
import { ConnectModeContext, type HandlePos } from '../../context/ConnectModeContext'

interface Props {
  nodeId: string
  position: HandlePos
}

const posStyle: Record<HandlePos, React.CSSProperties> = {
  top:    { top: 0,    left: '50%', transform: 'translate(-50%, -50%)' },
  bottom: { bottom: 0, left: '50%', transform: 'translate(-50%, 50%)' },
  left:   { top: '50%', left: 0,   transform: 'translate(-50%, -50%)' },
  right:  { top: '50%', right: 0,  transform: 'translate(50%, -50%)' },
}

export function ConnectHandle({ nodeId, position }: Props) {
  const { isActive, source, onTap } = useContext(ConnectModeContext)
  const downPos = useRef<{ x: number; y: number } | null>(null)

  if (!isActive) return null

  const isSource = source?.nodeId === nodeId && source?.handlePos === position

  return (
    <div
      className={`connect-handle-tap${isSource ? ' source' : ''}`}
      style={{ position: 'absolute', zIndex: 25, ...posStyle[position] }}
      onPointerDown={(e) => {
        e.stopPropagation()
        e.nativeEvent.stopImmediatePropagation()
        downPos.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerUp={(e) => {
        e.stopPropagation()
        if (!downPos.current) return
        const moved = Math.abs(e.clientX - downPos.current.x) > 10
          || Math.abs(e.clientY - downPos.current.y) > 10
        downPos.current = null
        if (!moved) onTap(nodeId, position)
      }}
    />
  )
}
