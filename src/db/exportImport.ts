import { z } from 'zod'
import type { ExportData } from '@/types'
import { db } from './database'

// Zod schema để validate dữ liệu nhập
const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  tags: z.array(z.string()),
  isDemo: z.boolean().optional(),
  subjectId: z.string().optional(),
  topicId: z.string().optional(),
})

const SubjectSchema = BaseEntitySchema.extend({
  name: z.string().min(1),
  code: z.string(),
  color: z.string(),
  description: z.string().optional(),
  semester: z.string().optional(),
})

const TopicSchema = BaseEntitySchema.extend({
  name: z.string().min(1),
  subjectId: z.string(),
  description: z.string().optional(),
  order: z.number(),
})

const LinkSchema = BaseEntitySchema.extend({
  fromType: z.string(),
  fromId: z.string(),
  toType: z.string(),
  toId: z.string(),
  kind: z.string(),
  label: z.string().optional(),
})

const ScheduleSchema = BaseEntitySchema.extend({
  className: z.string().min(1),
  classCode: z.string().optional(),
  teacher: z.string().optional(),
  room: z.string().optional(),
  color: z.string(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  weeks: z.array(z.number()),
  notes: z.string().optional(),
})

const NotebookSchema = BaseEntitySchema.extend({
  name: z.string().min(1),
  color: z.string(),
  order: z.number(),
})

const SectionSchema = BaseEntitySchema.extend({
  name: z.string().min(1),
  notebookId: z.string(),
  color: z.string().optional(),
  order: z.number(),
})

const PageSchema = BaseEntitySchema.extend({
  title: z.string(),
  content: z.string(),
  sectionId: z.string(),
  notebookId: z.string(),
  order: z.number(),
  wordCount: z.number().optional(),
})

const ExportDataSchema = z.object({
  version: z.number(),
  exportedAt: z.string(),
  subjects: z.array(SubjectSchema),
  topics: z.array(TopicSchema),
  links: z.array(LinkSchema),
  schedules: z.array(ScheduleSchema),
  notebooks: z.array(NotebookSchema),
  sections: z.array(SectionSchema),
  pages: z.array(PageSchema),
  noteVersions: z.array(z.object({
    id: z.string(),
    pageId: z.string(),
    content: z.string(),
    savedAt: z.coerce.date(),
    wordCount: z.number().optional(),
  })),
})

export const EXPORT_VERSION = 1

/**
 * Xuất toàn bộ dữ liệu ra JSON
 */
export async function exportAllData(): Promise<ExportData> {
  const [subjects, topics, links, schedules, notebooks, sections, pages, noteVersions] =
    await Promise.all([
      db.subjects.toArray(),
      db.topics.toArray(),
      db.links.toArray(),
      db.schedules.toArray(),
      db.notebooks.toArray(),
      db.sections.toArray(),
      db.pages.toArray(),
      db.noteVersions.toArray(),
    ])

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    subjects,
    topics,
    links,
    schedules,
    notebooks,
    sections,
    pages,
    noteVersions,
  }
}

/**
 * Nhập dữ liệu từ JSON, validate bằng zod trước khi ghi
 * @throws Error nếu dữ liệu không hợp lệ
 */
export async function importAllData(raw: unknown): Promise<void> {
  // Validate
  const parsed = ExportDataSchema.parse(raw)

  // Ghi vào database trong một transaction lớn
  await db.transaction('rw', [
    db.subjects, db.topics, db.links, db.schedules,
    db.notebooks, db.sections, db.pages, db.noteVersions,
  ], async () => {
    // Xóa toàn bộ dữ liệu cũ
    await Promise.all([
      db.subjects.clear(),
      db.topics.clear(),
      db.links.clear(),
      db.schedules.clear(),
      db.notebooks.clear(),
      db.sections.clear(),
      db.pages.clear(),
      db.noteVersions.clear(),
    ])

    // Ghi dữ liệu mới
    if (parsed.subjects.length > 0) await db.subjects.bulkAdd(parsed.subjects as never[])
    if (parsed.topics.length > 0) await db.topics.bulkAdd(parsed.topics as never[])
    if (parsed.links.length > 0) await db.links.bulkAdd(parsed.links as never[])
    if (parsed.schedules.length > 0) await db.schedules.bulkAdd(parsed.schedules as never[])
    if (parsed.notebooks.length > 0) await db.notebooks.bulkAdd(parsed.notebooks as never[])
    if (parsed.sections.length > 0) await db.sections.bulkAdd(parsed.sections as never[])
    if (parsed.pages.length > 0) await db.pages.bulkAdd(parsed.pages as never[])
    if (parsed.noteVersions.length > 0) await db.noteVersions.bulkAdd(parsed.noteVersions as never[])
  })
}

/**
 * Tải xuống file JSON
 */
export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
