import React, { useMemo, useCallback, useEffect, useState, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { MindMapCustomNode, type MindMapNodeCustomData } from './MindMapCustomNode'
import { MindMapNodeModal } from './MindMapNodeModal'
import { applyAutoLayout, type LayoutDirection } from './autoLayout'
import { exportMindMapJSON, exportMindMapSVG, exportMindMapPNG, convertMindMapToNotePage } from './mindmapUtils'
import { vi } from '@/i18n/vi'
import {
  Download,
  FileCheck,
  Undo2,
  Redo2,
  ArrowRight,
  ArrowDown,
  CircleDot,
} from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import type { MindMap, MindMapNodeData, MindMapEdgeData } from '@/types'

interface Props {
  mindmap: MindMap
  onSave: (updated: MindMap) => void
}

const nodeTypes = {
  mindMapNode: MindMapCustomNode,
}

export const MindMapCanvas: React.FC<Props> = ({ mindmap, onSave }) => {
  const navigate = useNavigate()

  // State quản lý danh sách node & edge gốc
  const [internalNodes, setInternalNodes] = useState<MindMapNodeData[]>(mindmap.nodes || [])
  const [internalEdges, setInternalEdges] = useState<MindMapEdgeData[]>(mindmap.edges || [])
  const [editingNode, setEditingNode] = useState<MindMapNodeData | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  // Undo / Redo stack
  const historyRef = useRef<{ nodes: MindMapNodeData[]; edges: MindMapEdgeData[] }[]>([])
  const historyIndexRef = useRef<number>(-1)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Đẩy snapshot vào undo history
  const pushHistory = useCallback(
    (nodes: MindMapNodeData[], edges: MindMapEdgeData[]) => {
      const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1)
      newHistory.push({
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      })
      if (newHistory.length > 30) newHistory.shift()
      historyRef.current = newHistory
      historyIndexRef.current = newHistory.length - 1
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(false)
    },
    []
  )

  // Khởi tạo history lần đầu
  useEffect(() => {
    if (historyRef.current.length === 0 && mindmap.nodes.length > 0) {
      pushHistory(mindmap.nodes, mindmap.edges)
    }
  }, [mindmap, pushHistory])

  // Đồng bộ khi prop mindmap thay đổi từ ngoài
  useEffect(() => {
    setInternalNodes(mindmap.nodes || [])
    setInternalEdges(mindmap.edges || [])
  }, [mindmap.id])

  // Lưu tự động lên parent component (có debounce nhẹ)
  const triggerSave = useCallback(
    (newNodes: MindMapNodeData[], newEdges: MindMapEdgeData[]) => {
      setInternalNodes(newNodes)
      setInternalEdges(newEdges)
      pushHistory(newNodes, newEdges)
      onSave({
        ...mindmap,
        nodes: newNodes,
        edges: newEdges,
        updatedAt: new Date(),
      })
    },
    [mindmap, onSave, pushHistory]
  )

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1
      const state = historyRef.current[historyIndexRef.current]
      setInternalNodes(state.nodes)
      setInternalEdges(state.edges)
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(true)
      onSave({
        ...mindmap,
        nodes: state.nodes,
        edges: state.edges,
        updatedAt: new Date(),
      })
      toast.info('Đã hoàn tác')
    }
  }, [mindmap, onSave])

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1
      const state = historyRef.current[historyIndexRef.current]
      setInternalNodes(state.nodes)
      setInternalEdges(state.edges)
      setCanUndo(true)
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
      onSave({
        ...mindmap,
        nodes: state.nodes,
        edges: state.edges,
        updatedAt: new Date(),
      })
      toast.info('Đã làm lại')
    }
  }, [mindmap, onSave])

  // Xử lý collapse / expand các nhánh con
  const handleToggleCollapse = useCallback(
    (nodeId: string) => {
      const updated = internalNodes.map(n =>
        n.id === nodeId ? { ...n, collapsed: !n.collapsed } : n
      )
      triggerSave(updated, internalEdges)
    },
    [internalNodes, internalEdges, triggerSave]
  )

  // Thêm node con
  const handleAddChild = useCallback(
    (parentId: string) => {
      const parent = internalNodes.find(n => n.id === parentId)
      if (!parent) return

      const newId = `node-${Date.now()}`
      const newNode: MindMapNodeData = {
        id: newId,
        label: 'Node mới',
        color: parent.color || '#3b82f6',
        parentId: parent.id,
        x: parent.x + 260,
        y: parent.y + 60,
      }

      const newEdge: MindMapEdgeData = {
        id: `e-${parent.id}-${newId}`,
        source: parent.id,
        target: newId,
      }

      // Đảm bảo parent mở rộng nếu đang thu gọn
      const updatedNodes = internalNodes.map(n =>
        n.id === parentId ? { ...n, collapsed: false } : n
      )

      triggerSave([...updatedNodes, newNode], [...internalEdges, newEdge])
      setSelectedNodeId(newId)
      toast.success(vi.toast.created)
    },
    [internalNodes, internalEdges, triggerSave]
  )

  // Thêm node anh em (cùng cấp)
  const handleAddSibling = useCallback(
    (targetId: string) => {
      const target = internalNodes.find(n => n.id === targetId)
      if (!target) return

      const parentId = target.parentId
      const newId = `node-${Date.now()}`
      const newNode: MindMapNodeData = {
        id: newId,
        label: 'Node cùng cấp',
        color: target.color || '#3b82f6',
        parentId,
        x: target.x,
        y: target.y + 80,
      }

      const newEdges = [...internalEdges]
      if (parentId) {
        newEdges.push({
          id: `e-${parentId}-${newId}`,
          source: parentId,
          target: newId,
        })
      }

      triggerSave([...internalNodes, newNode], newEdges)
      setSelectedNodeId(newId)
      toast.success(vi.toast.created)
    },
    [internalNodes, internalEdges, triggerSave]
  )

  // Xóa node
  const handleDeleteNode = useCallback(
    (idToDelete: string) => {
      // Tìm tất cả con cháu đệ quy
      const toDelete = new Set<string>([idToDelete])
      let added = true
      while (added) {
        added = false
        internalNodes.forEach(n => {
          if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
            toDelete.add(n.id)
            added = true
          }
        })
      }

      const newNodes = internalNodes.filter(n => !toDelete.has(n.id))
      const newEdges = internalEdges.filter(
        e => !toDelete.has(e.source) && !toDelete.has(e.target)
      )

      triggerSave(newNodes, newEdges)
      if (selectedNodeId && toDelete.has(selectedNodeId)) {
        setSelectedNodeId(null)
      }
      toast.success(vi.toast.deleted)
    },
    [internalNodes, internalEdges, selectedNodeId, triggerSave]
  )

  // Chỉnh sửa node xong
  const handleSaveNodeData = useCallback(
    (updated: MindMapNodeData) => {
      const newNodes = internalNodes.map(n => (n.id === updated.id ? updated : n))
      triggerSave(newNodes, internalEdges)
    },
    [internalNodes, internalEdges, triggerSave]
  )

  // Áp dụng Auto-layout
  const handleApplyLayout = useCallback(
    (direction: LayoutDirection) => {
      const layouted = applyAutoLayout(internalNodes, internalEdges, direction)
      triggerSave(layouted, internalEdges)
      toast.success(`Đã căn chỉnh: ${direction}`)
    },
    [internalNodes, internalEdges, triggerSave]
  )

  // Lọc các node và edge bị ẩn do collapse
  const { visibleNodes, visibleEdges } = useMemo(() => {
    // Tập hợp các node bị collapsed
    const collapsedNodes = new Set<string>()
    internalNodes.forEach(n => {
      if (n.collapsed) collapsedNodes.add(n.id)
    })

    // Tìm tất cả con cháu của các node bị collapsed
    const hiddenNodeIds = new Set<string>()
    let added = true
    while (added) {
      added = false
      internalNodes.forEach(n => {
        if (
          n.parentId &&
          (collapsedNodes.has(n.parentId) || hiddenNodeIds.has(n.parentId)) &&
          !hiddenNodeIds.has(n.id)
        ) {
          hiddenNodeIds.add(n.id)
          added = true
        }
      })
    }

    // Đếm số con của mỗi node
    const childCountMap = new Map<string, number>()
    internalNodes.forEach(n => {
      if (n.parentId) {
        childCountMap.set(n.parentId, (childCountMap.get(n.parentId) || 0) + 1)
      }
    })

    const filteredNodes: Node[] = internalNodes
      .filter(n => !hiddenNodeIds.has(n.id))
      .map(n => {
        const count = childCountMap.get(n.id) || 0
        const customData: MindMapNodeCustomData = {
          ...n,
          hasChildren: count > 0,
          childCount: count,
          onToggleCollapse: handleToggleCollapse,
          onAddChild: handleAddChild,
          onEdit: nodeData => setEditingNode(nodeData),
        }
        return {
          id: n.id,
          type: 'mindMapNode',
          position: { x: n.x, y: n.y },
          data: customData as unknown as Record<string, unknown>,
          selected: n.id === selectedNodeId,
        }
      })

    const filteredEdges: Edge[] = internalEdges
      .filter(e => !hiddenNodeIds.has(e.source) && !hiddenNodeIds.has(e.target))
      .map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: false,
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      }))

    return { visibleNodes: filteredNodes, visibleEdges: filteredEdges }
  }, [internalNodes, internalEdges, selectedNodeId, handleToggleCollapse, handleAddChild])

  // React Flow state hooks
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState(visibleNodes)
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState(visibleEdges)

  useEffect(() => {
    setRfNodes(visibleNodes)
  }, [visibleNodes, setRfNodes])

  useEffect(() => {
    setRfEdges(visibleEdges)
  }, [visibleEdges, setRfEdges])

  // Khi kéo thả node dừng lại, lưu vị trí
  const onNodeDragStop = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (_: any, node: any) => {
      const updatedNodes = internalNodes.map(n =>
        n.id === node.id ? { ...n, x: node.position.x, y: node.position.y } : n
      )
      triggerSave(updatedNodes, internalEdges)
    },
    [internalNodes, internalEdges, triggerSave]
  )

  // Nối edge thủ công
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return
      const newEdge: MindMapEdgeData = {
        id: `e-${params.source}-${params.target}`,
        source: params.source,
        target: params.target,
      }
      const updatedNodes = internalNodes.map(n =>
        n.id === params.target ? { ...n, parentId: params.source || undefined } : n
      )
      triggerSave(updatedNodes, [...internalEdges, newEdge])
    },
    [internalNodes, internalEdges, triggerSave]
  )

  // Bắt phím tắt (Tab: con, Enter: cùng cấp, Del: xóa, Ctrl+Z: undo, Ctrl+Y: redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua nếu đang gõ trong input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        handleRedo()
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        if (selectedNodeId) {
          handleAddChild(selectedNodeId)
        } else if (internalNodes.length > 0) {
          handleAddChild(internalNodes[0].id)
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedNodeId) {
          handleAddSibling(selectedNodeId)
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault()
          handleDeleteNode(selectedNodeId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, internalNodes, handleAddChild, handleAddSibling, handleDeleteNode, handleUndo, handleRedo])

  // Chuyển thành note checklist
  const handleConvertToChecklist = async () => {
    try {
      await convertMindMapToNotePage(mindmap)
      toast.success(vi.mindmap.noteCreatedSuccess)
      navigate(`/notes`)
    } catch (err) {
      console.error(err)
      toast.error(vi.errors.unknown)
    }
  }

  return (
    <div className="relative w-full h-full bg-slate-50 dark:bg-dark-bg overflow-hidden select-none">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        fitView
        deleteKeyCode={null} // Đã xử lý phím tắt riêng
        className="touch-none"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#cbd5e1" />
        <Controls showInteractive={false} className="!bg-white dark:!bg-dark-card !border-slate-200 dark:!border-dark-border" />
        <MiniMap
          nodeColor={n => (n.data as unknown as MindMapNodeCustomData)?.color || '#6366f1'}
          className="!bg-white/80 dark:!bg-dark-card/80 !border-slate-200 dark:!border-dark-border"
        />

        {/* Top Control Bar Panel */}
        <Panel position="top-right" className="flex items-center gap-1.5 bg-white/90 dark:bg-dark-card/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-dark-border shadow-md">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
            title={vi.mindmap.undo}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
            title={vi.mindmap.redo}
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-dark-border mx-0.5" />

          {/* Auto Layouts */}
          <button
            onClick={() => handleApplyLayout('horizontal')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted text-xs text-slate-700 dark:text-slate-200"
            title={vi.mindmap.layoutHorizontal}
          >
            <ArrowRight className="w-3.5 h-3.5 text-primary-500" />
            <span className="hidden sm:inline">{vi.mindmap.layoutHorizontal}</span>
          </button>
          <button
            onClick={() => handleApplyLayout('vertical')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted text-xs text-slate-700 dark:text-slate-200"
            title={vi.mindmap.layoutVertical}
          >
            <ArrowDown className="w-3.5 h-3.5 text-primary-500" />
            <span className="hidden sm:inline">{vi.mindmap.layoutVertical}</span>
          </button>
          <button
            onClick={() => handleApplyLayout('radial')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted text-xs text-slate-700 dark:text-slate-200"
            title={vi.mindmap.layoutRadial}
          >
            <CircleDot className="w-3.5 h-3.5 text-primary-500" />
            <span className="hidden sm:inline">{vi.mindmap.layoutRadial}</span>
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-dark-border mx-0.5" />

          {/* Export Options */}
          <button
            onClick={() => exportMindMapPNG(mindmap)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted text-slate-600 dark:text-slate-300"
            title={vi.mindmap.exportPNG}
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => exportMindMapSVG(mindmap)}
            className="px-1.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted text-xs font-mono font-bold text-slate-600 dark:text-slate-300"
            title={vi.mindmap.exportSVG}
          >
            SVG
          </button>
          <button
            onClick={() => exportMindMapJSON(mindmap)}
            className="px-1.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted text-xs font-mono font-bold text-slate-600 dark:text-slate-300"
            title={vi.mindmap.exportJSON}
          >
            JSON
          </button>

          <div className="w-px h-4 bg-slate-200 dark:bg-dark-border mx-0.5" />

          {/* Convert to Note checklist */}
          <button
            onClick={handleConvertToChecklist}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium transition-colors"
            title={vi.mindmap.convertToChecklist}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tạo Checklist Note</span>
          </button>
        </Panel>

        {/* Bottom Shortcut hint bar */}
        <Panel position="bottom-center" className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 dark:border-dark-border shadow-sm text-[11px] text-slate-500 dark:text-slate-400">
          {vi.mindmap.shortcutsHint}
        </Panel>
      </ReactFlow>

      {/* Node Edit Modal */}
      {editingNode && (
        <MindMapNodeModal
          node={editingNode}
          onClose={() => setEditingNode(null)}
          onSave={handleSaveNodeData}
          onDelete={handleDeleteNode}
        />
      )}
    </div>
  )
}
