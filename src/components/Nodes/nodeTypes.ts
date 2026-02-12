import type { NodeTypes } from '@xyflow/react'
import ActionNode from './ActionNode'
import DecisionNode from './DecisionNode'
import StartEndNode from './StartEndNode'
import AreaNode from './AreaNode'

export const nodeTypes: NodeTypes = {
  action: ActionNode,
  decision: DecisionNode,
  startEnd: StartEndNode,
  area: AreaNode,
}
