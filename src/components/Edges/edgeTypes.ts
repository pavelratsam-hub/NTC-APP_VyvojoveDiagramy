import { MarkerType, type DefaultEdgeOptions, type EdgeTypes } from '@xyflow/react'
import { StepEdge } from './StepEdge'
import { StraightEdge } from './CustomEdge'

// Vlastní edge typy
export const edgeTypes: EdgeTypes = {
  step: StepEdge,
  straight: StraightEdge,
}

// Výchozí nastavení pro všechny hrany
export const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'step',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 12,
    height: 12,
    color: '#333',
  },
  style: {
    strokeWidth: 2,
    stroke: '#333',
  },
}
