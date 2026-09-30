// Các type cơ bản dùng xuyên suốt ứng dụng
import type { MindMap, KnowledgeNode, KnowledgeEdge } from './mindmapKnowledge'
import type { Question, ExamAttempt, Formula, CalcHistoryItem } from './quizCalculator'
import type { ElectronicComponent } from './components'

// === Entity base ===
export interface BaseEntity {
  id: string              // uuid v4
  createdAt: Date
  updatedAt: Date
  tags: string[]
  isDemo?: boolean        // cờ đánh dấu dữ liệu mẫu
  subjectId?: string
  topicId?: string
}

// === Subject & Topic ===
export interface Subject extends BaseEntity {
  name: string
  code: string
  color: string           // hex color
  description?: string
  semester?: string
}

export interface Topic extends BaseEntity {
  name: string
  subjectId: string
  description?: string
  order: number
}

// === Link (backlink và cross-module) ===
export type EntityType =
  | 'note'
  | 'mindmap'
  | 'question'
  | 'formula'
  | 'knowledge_node'
  | 'component'
  | 'schedule'
  | 'subject'
  | 'topic'

export type LinkKind = 'wiki' | 'reference' | 'related' | 'prerequisite'

export interface Link extends BaseEntity {
  fromType: EntityType
  fromId: string
  toType: EntityType
  toId: string
  kind: LinkKind
  label?: string
}

// === Thời khóa biểu (M1) & Học kỳ ===
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0 = Chủ nhật, 1-6 = Thứ 2-7

export interface Semester extends BaseEntity {
  name: string            // Tên học kỳ, vd: "HK1 2026-2027"
  startDate: Date         // Ngày bắt đầu (Thứ 2 Tuần 1)
  weeksCount: number      // Số tuần trong học kỳ (vd: 16)
  isCurrent?: boolean     // Đánh dấu học kỳ đang hoạt động
}

export interface ScheduleEntry extends BaseEntity {
  className: string       // Tên môn
  classCode?: string      // Mã môn
  teacher?: string        // Giảng viên
  room?: string           // Phòng học
  color: string           // Màu hiển thị
  dayOfWeek: WeekDay      // Ngày trong tuần
  startTime: string       // HH:mm
  endTime: string         // HH:mm
  weeks: number[]         // Danh sách tuần học (rỗng = tất cả các tuần)
  notes?: string
  // Các trường mở rộng Phase S2 (toàn bộ là optional)
  periodStart?: number
  periodEnd?: number
  classGroupCode?: string // Mã lớp học phần (vd: 261_71ELEC30083_01)
  weekOverrides?: Record<number, { room?: string }> // Đổi phòng theo từng tuần
}

// === Ghi chú (M2) ===
export interface Notebook extends BaseEntity {
  name: string
  color: string
  order: number
}

export interface NoteSection extends BaseEntity {
  name: string
  notebookId: string
  color?: string
  order: number
}

export interface NotePage extends BaseEntity {
  title: string
  content: string         // HTML từ TipTap, đã qua DOMPurify
  sectionId: string
  notebookId: string
  order: number
  wordCount?: number
}

export interface NoteVersion {
  id: string
  pageId: string
  content: string
  savedAt: Date
  wordCount?: number
}

export interface NoteImage {
  id: string
  pageId: string
  blob: Blob
  mimeType: string
  fileName?: string
  size?: number
  isDemo?: boolean
  createdAt: Date
  updatedAt?: Date
}

// === Theme ===
export type ThemeMode = 'light' | 'dark' | 'system'

// === Xuất nhập ===
export interface ExportData {
  version: number
  exportedAt: string      // ISO string
  subjects: Subject[]
  topics: Topic[]
  links: Link[]
  schedules: ScheduleEntry[]
  semesters?: Semester[]
  notebooks: Notebook[]
  sections: NoteSection[]
  pages: NotePage[]
  noteVersions: NoteVersion[]
  mindmaps?: MindMap[]
  knowledgeNodes?: KnowledgeNode[]
  knowledgeEdges?: KnowledgeEdge[]
  questions?: Question[]
  examAttempts?: ExamAttempt[]
  formulas?: Formula[]
  calcHistory?: CalcHistoryItem[]
  electronicComponents?: ElectronicComponent[]
}

export * from './mindmapKnowledge'
export * from './quizCalculator'
export * from './components'

// === Search result ===
export interface SearchResult {
  id: string
  type: EntityType
  title: string
  subtitle?: string
  url: string
  excerpt?: string
  updatedAt: Date
}

// === Module registration ===
export interface ModuleConfig {
  id: string
  name: string
  icon: string
  path: string
  enabled: boolean        // chỉ hiện trong sidebar nếu true
}
