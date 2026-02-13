import type { Node, Edge } from '@xyflow/react'

export type NodeType = 'action' | 'decision' | 'startEnd' | 'area'

export interface ColorPair {
  fill: string
  stroke: string
}

export const COLOR_PAIRS: ColorPair[] = [
  { fill: '#ffffff', stroke: '#333333' }, // Bílá (výchozí)
  { fill: '#dbeafe', stroke: '#1e40af' }, // Modrá
  { fill: '#dcfce7', stroke: '#166534' }, // Zelená
  { fill: '#fee2e2', stroke: '#991b1b' }, // Červená
  { fill: '#fef9c3', stroke: '#854d0e' }, // Žlutá
  { fill: '#f3e8ff', stroke: '#6b21a8' }, // Fialová
  { fill: '#ffedd5', stroke: '#9a3412' }, // Oranžová
  { fill: '#f3f4f6', stroke: '#374151' }, // Šedá
]

export type DiagramNodeData = {
  label: string
  description?: string
  wrapText?: boolean
  colorIndex?: number
  fontSize?: number
  groupColor?: string
  groupLabel?: string
  lineStyle?: 'solid' | 'dashed'
  showFill?: boolean
  locked?: boolean
  [key: string]: unknown
}

export type DiagramNode = Node<DiagramNodeData>

export type DiagramEdgeData = {
  label?: string
  lineStyle?: 'solid' | 'dashed'
  segmentOffsets?: number[]
  labelPosition?: number  // 0–1 along path length, default 0.5
  [key: string]: unknown
}

export type DiagramEdge = Edge<DiagramEdgeData>

export type PaperFormat = 'A4' | 'A5' | 'custom'

export interface PaperSettings {
  format: PaperFormat
  width: number  // in mm
  height: number // in mm
  orientation: 'portrait' | 'landscape'
}

export interface DiagramState {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  paper: PaperSettings
}

export const PAPER_SIZES: Record<PaperFormat, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  custom: { width: 210, height: 297 },
}
