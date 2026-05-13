import { createContext } from 'react'

export type HandlePos = 'top' | 'bottom' | 'left' | 'right'

export interface SourceHandle {
  nodeId: string
  handlePos: HandlePos
}

export const ConnectModeContext = createContext<{
  isActive: boolean
  source: SourceHandle | null
  onTap: (nodeId: string, handlePos: HandlePos) => void
}>({
  isActive: false,
  source: null,
  onTap: () => {},
})
