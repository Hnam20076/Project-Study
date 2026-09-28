import type { MindMapNodeData, MindMapEdgeData } from '@/types'

export type LayoutDirection = 'horizontal' | 'vertical' | 'radial'

interface HierarchyNode {
  id: string
  children: HierarchyNode[]
  depth: number
  leafIndex: number
  subtreeLeaves: number
}

function buildHierarchy(
  nodes: MindMapNodeData[],
  edges: MindMapEdgeData[]
): { roots: HierarchyNode[]; nodeMap: Map<string, MindMapNodeData> } {
  const nodeMap = new Map<string, MindMapNodeData>()
  nodes.forEach(n => nodeMap.set(n.id, n))

  const parentMap = new Map<string, string>()
  const childrenMap = new Map<string, string[]>()

  nodes.forEach(n => {
    childrenMap.set(n.id, [])
    if (n.parentId) {
      parentMap.set(n.id, n.parentId)
    }
  })

  // Nếu trong edges có thông tin cha con bổ sung
  edges.forEach(e => {
    if (!parentMap.has(e.target)) {
      parentMap.set(e.target, e.source)
    }
  })

  // Gán children
  nodes.forEach(n => {
    const pId = parentMap.get(n.id)
    if (pId && childrenMap.has(pId)) {
      childrenMap.get(pId)!.push(n.id)
    }
  })

  // Tìm các root
  const rootIds = nodes.filter(n => !parentMap.has(n.id)).map(n => n.id)
  if (rootIds.length === 0 && nodes.length > 0) {
    rootIds.push(nodes[0].id)
  }

  let leafCounter = 0

  function buildSubtree(id: string, depth: number): HierarchyNode {
    const childIds = childrenMap.get(id) || []
    if (childIds.length === 0) {
      const node: HierarchyNode = {
        id,
        children: [],
        depth,
        leafIndex: leafCounter++,
        subtreeLeaves: 1,
      }
      return node
    }

    const children = childIds.map(cId => buildSubtree(cId, depth + 1))
    const subtreeLeaves = children.reduce((sum, c) => sum + c.subtreeLeaves, 0)
    return {
      id,
      children,
      depth,
      leafIndex: -1,
      subtreeLeaves,
    }
  }

  const roots = rootIds.map(rId => buildSubtree(rId, 0))
  return { roots, nodeMap }
}

/**
 * Áp dụng auto-layout theo cây ngang, cây dọc hoặc tỏa tròn
 */
export function applyAutoLayout(
  nodes: MindMapNodeData[],
  edges: MindMapEdgeData[],
  direction: LayoutDirection
): MindMapNodeData[] {
  if (nodes.length <= 1) return nodes

  const { roots, nodeMap } = buildHierarchy(nodes, edges)
  const posMap = new Map<string, { x: number; y: number }>()

  if (direction === 'horizontal') {
    const H_GAP = 280
    const V_GAP = 90

    function layoutHorizontal(node: HierarchyNode): number {
      const x = node.depth * H_GAP
      if (node.children.length === 0) {
        const y = node.leafIndex * V_GAP
        posMap.set(node.id, { x, y })
        return y
      }

      const childYs = node.children.map(c => layoutHorizontal(c))
      const avgY = (Math.min(...childYs) + Math.max(...childYs)) / 2
      posMap.set(node.id, { x, y: avgY })
      return avgY
    }

    roots.forEach(r => layoutHorizontal(r))
  } else if (direction === 'vertical') {
    const V_GAP = 160
    const H_GAP = 220

    function layoutVertical(node: HierarchyNode): number {
      const y = node.depth * V_GAP
      if (node.children.length === 0) {
        const x = node.leafIndex * H_GAP
        posMap.set(node.id, { x, y })
        return x
      }

      const childXs = node.children.map(c => layoutVertical(c))
      const avgX = (Math.min(...childXs) + Math.max(...childXs)) / 2
      posMap.set(node.id, { x: avgX, y })
      return avgX
    }

    roots.forEach(r => layoutVertical(r))
  } else if (direction === 'radial') {
    const BASE_RADIUS = 220

    function layoutRadial(
      node: HierarchyNode,
      startAngle: number,
      endAngle: number
    ) {
      if (node.depth === 0) {
        posMap.set(node.id, { x: 0, y: 0 })
      } else {
        const angle = (startAngle + endAngle) / 2
        const r = node.depth * BASE_RADIUS
        posMap.set(node.id, {
          x: Math.round(r * Math.cos(angle)),
          y: Math.round(r * Math.sin(angle)),
        })
      }

      const totalLeaves = node.subtreeLeaves
      let currentAngle = startAngle

      node.children.forEach(c => {
        const span = (c.subtreeLeaves / totalLeaves) * (endAngle - startAngle)
        layoutRadial(c, currentAngle, currentAngle + span)
        currentAngle += span
      })
    }

    roots.forEach(r => layoutRadial(r, 0, 2 * Math.PI))
  }

  // Cập nhật tọa độ cho các node
  return nodes.map(n => {
    const pos = posMap.get(n.id)
    if (!pos) return n
    return {
      ...n,
      x: pos.x,
      y: pos.y,
    }
  })
}
