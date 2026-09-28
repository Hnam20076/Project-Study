import React, { useState, useMemo, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ReactFlowProvider } from '@xyflow/react'
import { knowledgeNodeRepo, knowledgeEdgeRepo, subjectRepo, pageRepo } from '@/db/repositories'
import { KnowledgeCanvas } from './KnowledgeCanvas'
import { KnowledgeNodeModal } from './KnowledgeNodeModal'
import { KnowledgeDetailPanel } from './KnowledgeDetailPanel'
import { KnowledgePathModal } from './KnowledgePathModal'
import { LinkSuggestionModal } from './LinkSuggestionModal'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { downloadJSON } from '@/db/exportImport'
import { vi } from '@/i18n/vi'
import {
  Globe2,
  Plus,
  Search,
  Filter,
  Route,
  Sparkles,
  Download,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { KnowledgeNode, KnowledgeRelationKind } from '@/types'
import type { PathResult } from './pathfinding'

const KnowledgeContent: React.FC = () => {
  const nodes = useLiveQuery(() => knowledgeNodeRepo.getAll(), []) ?? []
  const edges = useLiveQuery(() => knowledgeEdgeRepo.getAll(), []) ?? []
  const subjects = useLiveQuery(() => subjectRepo.getAll(), []) ?? []
  const allPages = useLiveQuery(() => pageRepo.getRecent(100), []) ?? []

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')

  // Selected Node for Detail Panel
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)

  // Modals state
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false)
  const [editingNode, setEditingNode] = useState<KnowledgeNode | null>(null)
  const [isPathModalOpen, setIsPathModalOpen] = useState(false)
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false)

  // Path highlight state
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set())
  const [highlightedEdgeIds, setHighlightedEdgeIds] = useState<Set<string>>(new Set())

  // Lọc nodes theo filter & search
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      // Lọc môn
      if (selectedSubjectId !== 'all' && n.subjectId !== selectedSubjectId) return false
      // Lọc độ khó
      if (selectedDifficulty !== 'all' && n.difficulty !== Number(selectedDifficulty)) return false
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = n.title.toLowerCase().includes(q)
        const matchDesc = n.description.toLowerCase().includes(q)
        const matchTag = n.tags.some(t => t.toLowerCase().includes(q))
        if (!matchTitle && !matchDesc && !matchTag) return false
      }
      return true
    })
  }, [nodes, selectedSubjectId, selectedDifficulty, searchQuery])

  // Lọc edges tương ứng
  const filteredEdges = useMemo(() => {
    const visibleIdSet = new Set(filteredNodes.map(n => n.id))
    return edges.filter(e => visibleIdSet.has(e.fromNodeId) && visibleIdSet.has(e.toNodeId))
  }, [edges, filteredNodes])

  // Notes liên quan tới node đang chọn (theo subjectId hoặc tags chung)
  const relatedNotes = useMemo(() => {
    if (!selectedNode) return []
    const nodeTags = new Set(selectedNode.tags.map(t => t.toLowerCase()))
    return allPages.filter(p => {
      if (selectedNode.subjectId && p.subjectId === selectedNode.subjectId) return true
      return p.tags.some(t => nodeTags.has(t.toLowerCase()))
    })
  }, [selectedNode, allPages])

  // Cập nhật vị trí node khi kéo thả
  const handleNodeDragStop = useCallback(async (nodeId: string, x: number, y: number) => {
    await knowledgeNodeRepo.update(nodeId, { x, y })
  }, [])

  // Nối quan hệ mới
  const handleConnectEdge = useCallback(
    async (fromId: string, toId: string, kind: KnowledgeRelationKind) => {
      // Kiểm tra trùng cạnh
      const exists = edges.some(
        e => e.fromNodeId === fromId && e.toNodeId === toId && e.kind === kind
      )
      if (exists) {
        toast.info('Liên kết quan hệ này đã tồn tại')
        return
      }
      await knowledgeEdgeRepo.create({
        fromNodeId: fromId,
        toNodeId: toId,
        kind,
      })
      toast.success(vi.toast.created)
    },
    [edges]
  )

  // Xóa cạnh
  const handleDeleteEdge = useCallback(async (edgeId: string) => {
    await knowledgeEdgeRepo.delete(edgeId)
    toast.success(vi.toast.deleted)
  }, [])

  // Xóa node
  const handleDeleteNode = useCallback(async (nodeId: string) => {
    await knowledgeNodeRepo.delete(nodeId)
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
    toast.success(vi.toast.deleted)
  }, [selectedNode])

  // Lưu node
  const handleSaveNode = async (
    data: Omit<KnowledgeNode, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    if (id) {
      await knowledgeNodeRepo.update(id, data)
      toast.success(vi.toast.updated)
      if (selectedNode?.id === id) {
        setSelectedNode(prev => (prev ? { ...prev, ...data } : null))
      }
    } else {
      const created = await knowledgeNodeRepo.create(data)
      toast.success(vi.toast.created)
      setSelectedNode(created)
    }
  }

  // Highlight lộ trình BFS
  const handleHighlightPath = (path: PathResult) => {
    setHighlightedNodeIds(new Set(path.nodeIds))
    setHighlightedEdgeIds(new Set(path.edgeIds))
    toast.info(`Đã tô sáng lộ trình (${path.nodeIds.length} bước)`)
  }

  const handleClearHighlight = () => {
    setHighlightedNodeIds(new Set())
    setHighlightedEdgeIds(new Set())
  }

  // Xuất JSON toàn bộ mạng lưới tri thức
  const handleExportJSON = () => {
    const payload = {
      nodes,
      edges,
      exportedAt: new Date().toISOString(),
      count: { nodes: nodes.length, edges: edges.length },
    }
    downloadJSON(payload, `knowledge-graph-${new Date().toISOString().slice(0, 10)}.json`)
    toast.success(vi.toast.exported)
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative">
      {/* Top Header & Filter Bar */}
      <header className="px-4 py-2.5 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border z-10 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Module Title */}
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
            <Globe2 className="w-5 h-5 flex-shrink-0" />
            <h1 className="font-bold text-base text-slate-800 dark:text-slate-100">
              {vi.knowledge.title}
            </h1>
            <span className="text-xs text-slate-400 font-normal">
              ({filteredNodes.length} điểm · {filteredEdges.length} liên kết)
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Find Path BFS */}
            <button
              onClick={() => setIsPathModalOpen(true)}
              className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
              title={vi.knowledge.knowledgePath}
            >
              <Route className="w-3.5 h-3.5 text-primary-600" />
              <span className="hidden sm:inline">{vi.knowledge.knowledgePath}</span>
            </button>

            {/* Link Suggestions */}
            <button
              onClick={() => setIsSuggestModalOpen(true)}
              className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1"
              title={vi.knowledge.linkSuggestions}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Gợi ý liên kết</span>
            </button>

            {/* Clear highlight nếu đang có */}
            {(highlightedNodeIds.size > 0 || highlightedEdgeIds.size > 0) && (
              <button
                onClick={handleClearHighlight}
                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 bg-slate-100 dark:bg-dark-muted rounded-lg"
              >
                Xóa tô sáng
              </button>
            )}

            {/* Export JSON */}
            <button
              onClick={handleExportJSON}
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-muted"
              title={vi.knowledge.exportJSON}
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Add Node */}
            <button
              onClick={() => {
                setEditingNode(null)
                setIsNodeModalOpen(true)
              }}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{vi.knowledge.newNode}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={vi.knowledge.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input pl-8 py-1 text-xs w-full"
            />
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              className="input py-1 text-xs w-36"
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
            >
              <option value="all">Tất cả môn học</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <select
            className="input py-1 text-xs w-28"
            value={selectedDifficulty}
            onChange={e => setSelectedDifficulty(e.target.value)}
          >
            <option value="all">Mọi độ khó</option>
            <option value="1">Mức 1 (Cơ bản)</option>
            <option value="2">Mức 2 (Dễ)</option>
            <option value="3">Mức 3 (Trung bình)</option>
            <option value="4">Mức 4 (Khó)</option>
            <option value="5">Mức 5 (Rất khó)</option>
          </select>

          {/* Datasheet Notice */}
          <div className="hidden xl:flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 ml-auto bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span>{vi.knowledge.unverifiedNotice}</span>
          </div>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        {filteredNodes.length > 0 ? (
          <ReactFlowProvider>
            <KnowledgeCanvas
              nodes={filteredNodes}
              edges={filteredEdges}
              highlightedNodeIds={highlightedNodeIds}
              highlightedEdgeIds={highlightedEdgeIds}
              selectedNodeId={selectedNode?.id || null}
              onSelectNode={node => setSelectedNode(node)}
              onNodeDragStop={handleNodeDragStop}
              onConnectEdge={handleConnectEdge}
            />
          </ReactFlowProvider>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Globe2 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">{vi.knowledge.noNodes}</p>
            <button
              onClick={() => {
                setEditingNode(null)
                setIsNodeModalOpen(true)
              }}
              className="btn-primary mt-3 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{vi.knowledge.newNode}</span>
            </button>
          </div>
        )}

        {/* Side Detail Panel */}
        {selectedNode && (
          <KnowledgeDetailPanel
            node={selectedNode}
            allNodes={nodes}
            edges={edges}
            relatedNotes={relatedNotes}
            onClose={() => setSelectedNode(null)}
            onEdit={n => {
              setEditingNode(n)
              setIsNodeModalOpen(true)
            }}
            onDelete={handleDeleteNode}
            onAddEdge={handleConnectEdge}
            onDeleteEdge={handleDeleteEdge}
            onSelectNode={nId => {
              const target = nodes.find(n => n.id === nId)
              if (target) setSelectedNode(target)
            }}
          />
        )}
      </div>

      {/* Modals */}
      {isNodeModalOpen && (
        <KnowledgeNodeModal
          node={editingNode}
          subjects={subjects}
          onClose={() => {
            setIsNodeModalOpen(false)
            setEditingNode(null)
          }}
          onSave={handleSaveNode}
          onDelete={editingNode ? handleDeleteNode : undefined}
        />
      )}

      {isPathModalOpen && (
        <KnowledgePathModal
          nodes={nodes}
          edges={edges}
          onClose={() => setIsPathModalOpen(false)}
          onHighlightPath={handleHighlightPath}
        />
      )}

      {isSuggestModalOpen && (
        <LinkSuggestionModal
          nodes={nodes}
          edges={edges}
          onClose={() => setIsSuggestModalOpen(false)}
          onAddEdge={handleConnectEdge}
        />
      )}
    </div>
  )
}

export const KnowledgePage: React.FC = () => {
  return (
    <ErrorBoundary moduleName={vi.nav.knowledge}>
      <KnowledgeContent />
    </ErrorBoundary>
  )
}
