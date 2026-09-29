import Dexie, { type Table } from 'dexie'
import type {
  Subject,
  Topic,
  Link,
  ScheduleEntry,
  Notebook,
  NoteSection,
  NotePage,
  NoteVersion,
  NoteImage,
  MindMap,
  KnowledgeNode,
  KnowledgeEdge,
  Question,
  ExamAttempt,
  Formula,
  CalcHistoryItem,
  ElectronicComponent,
  StoredExamSession,
} from '@/types'

// Phiên bản database - tăng khi thay đổi schema
const DB_VERSION = 6

/**
 * Lớp database chính dùng Dexie (IndexedDB wrapper)
 * Mọi thay đổi schema PHẢI tăng DB_VERSION và viết migration
 */
class StudyOSDatabase extends Dexie {
  // Khai báo tất cả các bảng
  subjects!: Table<Subject>
  topics!: Table<Topic>
  links!: Table<Link>
  schedules!: Table<ScheduleEntry>
  notebooks!: Table<Notebook>
  sections!: Table<NoteSection>
  pages!: Table<NotePage>
  noteVersions!: Table<NoteVersion>
  noteImages!: Table<NoteImage>
  mindmaps!: Table<MindMap>
  knowledgeNodes!: Table<KnowledgeNode>
  knowledgeEdges!: Table<KnowledgeEdge>
  questions!: Table<Question>
  examAttempts!: Table<ExamAttempt>
  formulas!: Table<Formula>
  calcHistory!: Table<CalcHistoryItem>
  electronicComponents!: Table<ElectronicComponent>
  examSessions!: Table<StoredExamSession>

  constructor() {
    super('StudyOSDatabase')

    this.version(1).stores({
      subjects: 'id, name, isDemo, createdAt',
      topics: 'id, subjectId, name, order, isDemo, createdAt',
      links: 'id, fromId, toId, fromType, toType, kind, isDemo',
      schedules: 'id, className, dayOfWeek, isDemo, createdAt',
      notebooks: 'id, name, order, isDemo, createdAt',
      sections: 'id, notebookId, name, order, isDemo, createdAt',
      pages: 'id, sectionId, notebookId, title, order, isDemo, updatedAt',
      noteVersions: 'id, pageId, savedAt',
      noteImages: 'id, pageId, createdAt',
    })

    this.version(2).stores({
      mindmaps: 'id, name, isDemo, createdAt, updatedAt',
      knowledgeNodes: 'id, title, difficulty, isDemo, createdAt, updatedAt',
      knowledgeEdges: 'id, fromNodeId, toNodeId, kind, isDemo',
    })

    this.version(3).stores({
      questions: 'id, subjectId, topicId, difficulty, isDemo, createdAt',
      examAttempts: 'id, subjectId, score, isDemo, completedAt, createdAt',
      formulas: 'id, category, name, isDemo, createdAt',
      calcHistory: 'id, createdAt',
    })

    this.version(4).stores({
      electronicComponents: 'id, name, code, category, package, isDemo, createdAt',
    })

    this.version(5).stores({
      topics: 'id, subjectId, name, order, isDemo, createdAt',
    })

    this.version(DB_VERSION).stores({
      examSessions: 'id, subjectId, createdAt, expiresAt',
    }).upgrade(() => {
      // Version 6 migration: khởi tạo bảng examSessions
    })
  }
}

// Singleton instance
export const db = new StudyOSDatabase()

// Hook để kiểm tra xem database đã sẵn sàng chưa
export async function ensureDBReady(): Promise<void> {
  await db.open()
}
