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
} from '@/types'

// Phiên bản database - tăng khi thay đổi schema
const DB_VERSION = 1

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

  constructor() {
    super('StudyOSDatabase')

    this.version(DB_VERSION).stores({
      // Khai báo index cho từng bảng
      // id là primary key
      subjects: 'id, name, isDemo, createdAt',
      topics: 'id, subjectId, name, isDemo, createdAt',
      links: 'id, fromId, toId, fromType, toType, kind, isDemo',
      schedules: 'id, className, dayOfWeek, isDemo, createdAt',
      notebooks: 'id, name, order, isDemo, createdAt',
      sections: 'id, notebookId, name, order, isDemo, createdAt',
      pages: 'id, sectionId, notebookId, title, order, isDemo, updatedAt',
      noteVersions: 'id, pageId, savedAt',
      noteImages: 'id, pageId, createdAt',
    })
  }
}

// Singleton instance
export const db = new StudyOSDatabase()

// Hook để kiểm tra xem database đã sẵn sàng chưa
export async function ensureDBReady(): Promise<void> {
  await db.open()
}
