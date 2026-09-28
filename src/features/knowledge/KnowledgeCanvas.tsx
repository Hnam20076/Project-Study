import React, { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { KnowledgeCustomNode, type KnowledgeNodeCustomData } from './KnowledgeCustomNode'
import { RELATION_COLORS, RELATION_LABELS, type KnowledgeNode, type KnowledgeEdge, type KnowledgeRelationKind } from '@/types'

const nodeTypes = {
  knowledgeNode: KnowledgeCustomNode,
}

interface Props {
  nodes: KnowledgeNode[]
  edges: KnowledgeEdge[]
  highlightedNodeIds: Set<string>
  highlightedEdgeIds: Set<string>
  selectedNodeId: string | null
  onSelectNode: (node: KnowledgeNode | null) => void
  onNodeDragStop: (nodeId: string, x: number, y: number) => void
  onConnectEdge: (fromId: string, toId: string, kind: KnowledgeRelationKind) => void
}

export const KnowledgeCanvas: React.FC<Props> = ({
  nodes,
  edges,
  highlightedNodeIds,
  highlightedEdgeIds,
  selectedNodeId,
  onSelectNode,
  onNodeDragStop,
  onConnectEdge,
}) => {
  // Biến đổi sang React Flow Nodes
  const rfNodes: Node[] = useMemo(() => {
    return nodes.map(n => {
      const isHighlighted = highlightedNodeIds.has(n.id)
      const customData: KnowledgeNodeCustomData = {
        ...n,
        isHighlighted,
        onClickDetail: node => onSelectNode(node),
      }
      return {
        id: n.id,
        type: 'knowledgeNode',
        position: { x: n.x, y: n.y },
        data: customData as unknown as Record<string, unknown>,
        selected: n.id === selectedNodeId,
      }
    })
  }, [nodes, highlightedNodeIds, selectedNodeId, onSelectNode])

  // Biến đổi sang React Flow Edges
  const rfEdges: Edge[] = useMemo(() => {
    return edges.map(e => {
      const isHighlighted = highlightedEdgeIds.has(e.id)
      const color = RELATION_COLORS[e.kind as KnowledgeRelationKind] || '#94a3b8'
      const label = e.label || RELATION_LABELS[e.kind as KnowledgeRelationKind] || ''

      return {
        id: e.id,
        source: e.fromNodeId,
        target: e.toNodeId,
        label,
        animated: isHighlighted,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isHighlighted ? '#f59e0b' : color,
          width: 16,
          height: 16,
        },
        style: {
          stroke: isHighlighted ? '#f59e0b' : color,
          strokeWidth: isHighlighted ? 3.5 : 2,
        },
        labelStyle: {
          fontSize: 10,
          fontWeight: 600,
          fill: isHighlighted ? '#b45309' : '#64748b',
        },
        labelBgStyle: {
          fill: '#ffffff',
          fillOpacity: 0.85,
        },
      }
    })
  }, [edges, highlightedEdgeIds])

  const [, , onNodesChange] = useNodesState(rfNodes)
  const [, , onEdgesChange] = useEdgesState(rfEdges)

  const handleConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || params.source === params.target) return
      // Mặc định kết nối là Prerequisite (hoặc có thể chọn sau)
      onConnectEdge(params.source, params.target, 'Prerequisite')
    },
    [onConnectEdge]
  )

  const handleDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeDragStop(node.id, node.position.x, node.position.y)
    },
    [onNodeDragStop]
  )

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-50 dark:bg-dark-bg select-none">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeDragStop={handleDragStop}
        onPaneClick={() => onSelectNode(null)}
        fitView
        className="touch-none"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
        <Controls showInteractive={false} className="!bg-white dark:!bg-dark-card !border-slate-200 dark:!border-dark-border" />
        <MiniMap
          nodeColor="#6366f1"
          className="!bg-white/80 dark:!bg-dark-card/80 !border-slate-200 dark:!border-dark-border"
        />
      </ReactFlow>
    </div>
  )
}
