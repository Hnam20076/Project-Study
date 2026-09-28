// === MindMap types (M3) ===

// Dữ liệu node lưu trong IndexedDB (nhúng trong MindMap)
export interface MindMapNodeData {
  id: string
  label: string
  notes?: string
  color: string
  collapsed?: boolean
  // Loại nội dung đặc biệt
  formulaLatex?: string
  checkItems?: { id: string; text: string; checked: boolean }[]
  imageBase64?: string
  // React Flow position
  x: number
  y: number
  // Quan hệ cây
  parentId?: string
}

export interface MindMapEdgeData {
  id: string
  source: string
  target: string
  label?: string
}

// Entity lưu DB
export interface MindMap {
  id: string
  name: string
  nodes: MindMapNodeData[]
  edges: MindMapEdgeData[]
  viewport: { x: number; y: number; zoom: number }
  createdAt: Date
  updatedAt: Date
  tags: string[]
  isDemo?: boolean
  subjectId?: string
  topicId?: string
}

// === Knowledge Graph types (M6) ===

export type KnowledgeDifficulty = 1 | 2 | 3 | 4 | 5

export type KnowledgeRelationKind =
  | 'Prerequisite'   // Cần học trước
  | 'Related'        // Liên quan
  | 'PartOf'         // Là phần của
  | 'ExampleOf'      // Là ví dụ của
  | 'AppliedTo'      // Áp dụng vào

export interface KnowledgeNode {
  id: string
  title: string
  description: string
  formulaLatex?: string
  examples?: string
  references?: string
  difficulty: KnowledgeDifficulty
  tags: string[]
  source?: string
  sourceUrl?: string
  lastUpdated?: Date
  // Position trên graph
  x: number
  y: number
  // Entity fields
  createdAt: Date
  updatedAt: Date
  isDemo?: boolean
  verified?: boolean
  subjectId?: string
  topicId?: string
}

export interface KnowledgeEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  kind: KnowledgeRelationKind
  label?: string
  createdAt: Date
  updatedAt: Date
  isDemo?: boolean
}

// Nhãn hiển thị cho loại quan hệ
export const RELATION_LABELS: Record<KnowledgeRelationKind, string> = {
  Prerequisite: 'Cần học trước',
  Related: 'Liên quan',
  PartOf: 'Là phần của',
  ExampleOf: 'Là ví dụ của',
  AppliedTo: 'Áp dụng vào',
}

export const RELATION_COLORS: Record<KnowledgeRelationKind, string> = {
  Prerequisite: '#ef4444',   // đỏ - bắt buộc
  Related: '#3b82f6',        // xanh - liên quan
  PartOf: '#8b5cf6',         // tím - phân cấp
  ExampleOf: '#10b981',      // xanh lá - ví dụ
  AppliedTo: '#f59e0b',      // vàng - ứng dụng
}

// Màu mức độ khó
export const DIFFICULTY_COLORS: Record<KnowledgeDifficulty, string> = {
  1: '#10b981',  // rất dễ
  2: '#84cc16',  // dễ
  3: '#f59e0b',  // trung bình
  4: '#ef4444',  // khó
  5: '#8b5cf6',  // rất khó
}

export const DIFFICULTY_LABELS: Record<KnowledgeDifficulty, string> = {
  1: 'Cơ bản',
  2: 'Dễ',
  3: 'Trung bình',
  4: 'Khó',
  5: 'Rất khó',
}
