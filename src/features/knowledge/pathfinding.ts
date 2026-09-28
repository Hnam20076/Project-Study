import type { KnowledgeNode, KnowledgeEdge } from '@/types'

export interface PathResult {
  nodeIds: string[]
  edgeIds: string[]
}

/**
 * Tìm đường đi kiến thức ngắn nhất từ node A đến node B qua quan hệ 'Prerequisite' (thuật toán BFS)
 * A -> B: A là tiên quyết để học B (hoặc qua các bước trung gian)
 */
export function findPrerequisitePath(
  startId: string,
  targetId: string,
  edges: KnowledgeEdge[]
): PathResult | null {
  if (startId === targetId) {
    return { nodeIds: [startId], edgeIds: [] }
  }

  // Xây dựng danh sách kề chỉ xét các cạnh 'Prerequisite'
  // Cạnh: fromNodeId là điều kiện tiên quyết -> toNodeId là kiến thức sau
  const adj = new Map<string, { to: string; edgeId: string }[]>()

  edges.forEach(e => {
    if (e.kind === 'Prerequisite') {
      if (!adj.has(e.fromNodeId)) adj.set(e.fromNodeId, [])
      adj.get(e.fromNodeId)!.push({ to: e.toNodeId, edgeId: e.id })
    }
  })

  const queue: { current: string; pathNodes: string[]; pathEdges: string[] }[] = [
    { current: startId, pathNodes: [startId], pathEdges: [] },
  ]
  const visited = new Set<string>([startId])

  while (queue.length > 0) {
    const { current, pathNodes, pathEdges } = queue.shift()!

    const neighbors = adj.get(current) || []
    for (const neighbor of neighbors) {
      if (neighbor.to === targetId) {
        return {
          nodeIds: [...pathNodes, neighbor.to],
          edgeIds: [...pathEdges, neighbor.edgeId],
        }
      }

      if (!visited.has(neighbor.to)) {
        visited.add(neighbor.to)
        queue.push({
          current: neighbor.to,
          pathNodes: [...pathNodes, neighbor.to],
          pathEdges: [...pathEdges, neighbor.edgeId],
        })
      }
    }
  }

  return null
}

export interface LinkSuggestion {
  nodeA: KnowledgeNode
  nodeB: KnowledgeNode
  commonTags: string[]
}

/**
 * Phân tích và gợi ý liên kết dựa trên tag chung giữa các node chưa có cạnh nối (không dùng AI)
 */
export function suggestLinksByCommonTags(
  nodes: KnowledgeNode[],
  edges: KnowledgeEdge[]
): LinkSuggestion[] {
  // Tạo tập hợp các cặp đã nối cạnh
  const connectedPairs = new Set<string>()
  edges.forEach(e => {
    connectedPairs.add(`${e.fromNodeId}-${e.toNodeId}`)
    connectedPairs.add(`${e.toNodeId}-${e.fromNodeId}`)
  })

  const suggestions: LinkSuggestion[] = []

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i]
      const nodeB = nodes[j]

      const pairKey = `${nodeA.id}-${nodeB.id}`
      if (connectedPairs.has(pairKey)) continue

      const tagsA = new Set(nodeA.tags.map(t => t.toLowerCase().trim()))
      const common = nodeB.tags
        .map(t => t.toLowerCase().trim())
        .filter(t => t && tagsA.has(t))

      if (common.length > 0) {
        suggestions.push({
          nodeA,
          nodeB,
          commonTags: common,
        })
      }
    }
  }

  // Sắp xếp theo số lượng tag chung giảm dần
  return suggestions.sort((a, b) => b.commonTags.length - a.commonTags.length)
}
