import { db } from './database'
import { v4 as uuidv4 } from 'uuid'
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
  EntityType,
  LinkKind,
  MindMap,
  KnowledgeNode,
  KnowledgeEdge,
  Question,
  ExamAttempt,
  Formula,
  CalcHistoryItem,
  ElectronicComponent,
  ComponentCategory,
} from '@/types'

// Helper tạo timestamp hiện tại
const now = () => new Date()

// Helper tạo base entity fields
function baseFields(extra: Partial<{ subjectId: string; topicId: string }> = {}) {
  return {
    id: uuidv4(),
    createdAt: now(),
    updatedAt: now(),
    tags: [] as string[],
    ...extra,
  }
}

// === Subject Repository ===
export const subjectRepo = {
  async getAll(): Promise<Subject[]> {
    return db.subjects.orderBy('name').toArray()
  },

  async getById(id: string): Promise<Subject | undefined> {
    return db.subjects.get(id)
  },

  async create(data: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Promise<Subject> {
    const subject: Subject = { ...baseFields(), ...data }
    await db.subjects.add(subject)
    return subject
  },

  async update(id: string, data: Partial<Subject>): Promise<void> {
    await db.subjects.update(id, { ...data, updatedAt: now() })
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.subjects, db.topics, db.links], async () => {
      await db.subjects.delete(id)
      // Xóa cascade topics
      const topics = await db.topics.where('subjectId').equals(id).toArray()
      for (const topic of topics) {
        await db.topics.delete(topic.id)
        await db.links.where('fromId').equals(topic.id).delete()
        await db.links.where('toId').equals(topic.id).delete()
      }
      await db.links.where('fromId').equals(id).delete()
      await db.links.where('toId').equals(id).delete()
    })
  },

  async deleteDemoData(): Promise<void> {
    await db.subjects.filter(item => item.isDemo === true).delete()
  },
}

// === Topic Repository ===
export const topicRepo = {
  async getAll(): Promise<Topic[]> {
    const list = await db.topics.toArray()
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  },

  async getBySubject(subjectId: string): Promise<Topic[]> {
    const list = await db.topics.where('subjectId').equals(subjectId).toArray()
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  },

  async getById(id: string): Promise<Topic | undefined> {
    return db.topics.get(id)
  },

  async create(data: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>): Promise<Topic> {
    const topic: Topic = { ...baseFields({ subjectId: data.subjectId }), ...data }
    await db.topics.add(topic)
    return topic
  },

  async update(id: string, data: Partial<Topic>): Promise<void> {
    await db.topics.update(id, { ...data, updatedAt: now() })
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.topics, db.links], async () => {
      await db.topics.delete(id)
      await db.links.where('fromId').equals(id).delete()
      await db.links.where('toId').equals(id).delete()
    })
  },

  async deleteDemoData(): Promise<void> {
    await db.topics.filter(item => item.isDemo === true).delete()
  },
}

// === Link Repository ===
export const linkRepo = {
  async getLinksFrom(fromId: string): Promise<Link[]> {
    return db.links.where('fromId').equals(fromId).toArray()
  },

  async getLinksTo(toId: string): Promise<Link[]> {
    return db.links.where('toId').equals(toId).toArray()
  },

  async getBacklinks(toId: string): Promise<Link[]> {
    return db.links.where('toId').equals(toId).toArray()
  },

  async create(data: {
    fromType: EntityType
    fromId: string
    toType: EntityType
    toId: string
    kind: LinkKind
    label?: string
    isDemo?: boolean
  }): Promise<Link> {
    const link: Link = {
      ...baseFields(),
      ...data,
      tags: [],
    }
    await db.links.add(link)
    return link
  },

  async delete(id: string): Promise<void> {
    await db.links.delete(id)
  },

  async deleteByFromId(fromId: string): Promise<void> {
    await db.links.where('fromId').equals(fromId).delete()
  },

  async deleteDemoData(): Promise<void> {
    await db.links.filter(item => item.isDemo === true).delete()
  },
}

// === Schedule Repository ===
export const scheduleRepo = {
  async getAll(): Promise<ScheduleEntry[]> {
    return db.schedules.orderBy('createdAt').toArray()
  },

  async getById(id: string): Promise<ScheduleEntry | undefined> {
    return db.schedules.get(id)
  },

  async getByDay(dayOfWeek: number): Promise<ScheduleEntry[]> {
    return db.schedules.where('dayOfWeek').equals(dayOfWeek).toArray()
  },

  async create(data: Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScheduleEntry> {
    const entry: ScheduleEntry = { ...baseFields(), ...data }
    await db.schedules.add(entry)
    return entry
  },

  async update(id: string, data: Partial<ScheduleEntry>): Promise<void> {
    await db.schedules.update(id, { ...data, updatedAt: now() })
  },

  async delete(id: string): Promise<void> {
    await db.schedules.delete(id)
  },

  async deleteDemoData(): Promise<void> {
    await db.schedules.filter(item => item.isDemo === true).delete()
  },
}

// === Notebook Repository ===
export const notebookRepo = {
  async getAll(): Promise<Notebook[]> {
    return db.notebooks.orderBy('order').toArray()
  },

  async getById(id: string): Promise<Notebook | undefined> {
    return db.notebooks.get(id)
  },

  async create(data: Omit<Notebook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notebook> {
    const notebook: Notebook = { ...baseFields(), ...data }
    await db.notebooks.add(notebook)
    return notebook
  },

  async update(id: string, data: Partial<Notebook>): Promise<void> {
    await db.notebooks.update(id, { ...data, updatedAt: now() })
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.notebooks, db.sections, db.pages, db.noteVersions, db.noteImages], async () => {
      await db.notebooks.delete(id)
      const sections = await db.sections.where('notebookId').equals(id).toArray()
      for (const section of sections) {
        const pages = await db.pages.where('sectionId').equals(section.id).toArray()
        for (const page of pages) {
          await db.noteVersions.where('pageId').equals(page.id).delete()
          await db.noteImages.where('pageId').equals(page.id).delete()
          await db.pages.delete(page.id)
        }
        await db.sections.delete(section.id)
      }
    })
  },

  async deleteDemoData(): Promise<void> {
    await db.notebooks.filter(item => item.isDemo === true).delete()
  },

  async getMaxOrder(): Promise<number> {
    const notebooks = await db.notebooks.toArray()
    if (notebooks.length === 0) return 0
    return Math.max(...notebooks.map(n => n.order))
  },
}

// === Section Repository ===
export const sectionRepo = {
  async getByNotebook(notebookId: string): Promise<NoteSection[]> {
    return db.sections.where('notebookId').equals(notebookId).sortBy('order')
  },

  async getById(id: string): Promise<NoteSection | undefined> {
    return db.sections.get(id)
  },

  async create(data: Omit<NoteSection, 'id' | 'createdAt' | 'updatedAt'>): Promise<NoteSection> {
    const section: NoteSection = { ...baseFields(), ...data }
    await db.sections.add(section)
    return section
  },

  async update(id: string, data: Partial<NoteSection>): Promise<void> {
    await db.sections.update(id, { ...data, updatedAt: now() })
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.sections, db.pages, db.noteVersions, db.noteImages], async () => {
      const pages = await db.pages.where('sectionId').equals(id).toArray()
      for (const page of pages) {
        await db.noteVersions.where('pageId').equals(page.id).delete()
        await db.noteImages.where('pageId').equals(page.id).delete()
        await db.pages.delete(page.id)
      }
      await db.sections.delete(id)
    })
  },

  async deleteDemoData(): Promise<void> {
    await db.sections.filter(item => item.isDemo === true).delete()
  },

  async getMaxOrder(notebookId: string): Promise<number> {
    const sections = await db.sections.where('notebookId').equals(notebookId).toArray()
    if (sections.length === 0) return 0
    return Math.max(...sections.map(s => s.order))
  },
}

// === Page Repository ===
export const pageRepo = {
  async getBySection(sectionId: string): Promise<NotePage[]> {
    return db.pages.where('sectionId').equals(sectionId).sortBy('order')
  },

  async getById(id: string): Promise<NotePage | undefined> {
    return db.pages.get(id)
  },

  async getRecent(limit = 10): Promise<NotePage[]> {
    return db.pages.orderBy('updatedAt').reverse().limit(limit).toArray()
  },

  async searchFullText(query: string): Promise<NotePage[]> {
    // Tìm kiếm full-text phía client (đơn giản, lowercase match)
    const q = query.toLowerCase()
    return db.pages
      .filter(page =>
        page.title.toLowerCase().includes(q) ||
        page.content.toLowerCase().includes(q)
      )
      .limit(20)
      .toArray()
  },

  async create(data: Omit<NotePage, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotePage> {
    const page: NotePage = { ...baseFields(), ...data }
    await db.pages.add(page)
    return page
  },

  async update(id: string, data: Partial<NotePage>): Promise<void> {
    await db.pages.update(id, { ...data, updatedAt: now() })
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.pages, db.noteVersions, db.noteImages], async () => {
      await db.noteVersions.where('pageId').equals(id).delete()
      await db.noteImages.where('pageId').equals(id).delete()
      await db.pages.delete(id)
    })
  },

  async deleteDemoData(): Promise<void> {
    await db.pages.filter(item => item.isDemo === true).delete()
  },

  async getMaxOrder(sectionId: string): Promise<number> {
    const pages = await db.pages.where('sectionId').equals(sectionId).toArray()
    if (pages.length === 0) return 0
    return Math.max(...pages.map(p => p.order))
  },
}

// === Version Repository (tối đa 20 bản/trang) ===
const MAX_VERSIONS = 20

export const versionRepo = {
  async getByPage(pageId: string): Promise<NoteVersion[]> {
    return db.noteVersions.where('pageId').equals(pageId).reverse().sortBy('savedAt')
  },

  async save(pageId: string, content: string, wordCount?: number): Promise<void> {
    await db.transaction('rw', db.noteVersions, async () => {
      // Tạo version mới
      const version: NoteVersion = {
        id: uuidv4(),
        pageId,
        content,
        savedAt: now(),
        wordCount,
      }
      await db.noteVersions.add(version)

      // Giữ tối đa MAX_VERSIONS, xóa bản cũ nhất
      const all = await db.noteVersions.where('pageId').equals(pageId).sortBy('savedAt')
      if (all.length > MAX_VERSIONS) {
        const toDelete = all.slice(0, all.length - MAX_VERSIONS)
        await db.noteVersions.bulkDelete(toDelete.map(v => v.id))
      }
    })
  },
}

// === Image Repository ===
export const imageRepo = {
  async save(pageId: string, blob: Blob, mimeType: string, fileName?: string): Promise<NoteImage> {
    const image: NoteImage = {
      id: uuidv4(),
      pageId,
      blob,
      mimeType,
      fileName,
      createdAt: now(),
    }
    await db.noteImages.add(image)
    return image
  },

  async getById(id: string): Promise<NoteImage | undefined> {
    return db.noteImages.get(id)
  },

  async getByPage(pageId: string): Promise<NoteImage[]> {
    return db.noteImages.where('pageId').equals(pageId).toArray()
  },
}

// === MindMap Repository (M3) ===
export const mindmapRepo = {
  async getAll(): Promise<MindMap[]> {
    return db.mindmaps.orderBy('updatedAt').reverse().toArray()
  },

  async getById(id: string): Promise<MindMap | undefined> {
    return db.mindmaps.get(id)
  },

  async create(data: Omit<MindMap, 'id' | 'createdAt' | 'updatedAt'>): Promise<MindMap> {
    const mindmap: MindMap = { ...baseFields(), ...data }
    await db.mindmaps.add(mindmap)
    return mindmap
  },

  async update(id: string, data: Partial<MindMap>): Promise<void> {
    await db.mindmaps.update(id, { ...data, updatedAt: now() })
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.mindmaps, db.links], async () => {
      await db.mindmaps.delete(id)
      await db.links.where('fromId').equals(id).delete()
      await db.links.where('toId').equals(id).delete()
    })
  },

  async deleteDemoData(): Promise<void> {
    await db.mindmaps.filter(item => item.isDemo === true).delete()
  },
}

// === Knowledge Node Repository (M6) ===
export const knowledgeNodeRepo = {
  async getAll(): Promise<KnowledgeNode[]> {
    return db.knowledgeNodes.orderBy('title').toArray()
  },

  async getById(id: string): Promise<KnowledgeNode | undefined> {
    return db.knowledgeNodes.get(id)
  },

  async create(data: Omit<KnowledgeNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeNode> {
    const node: KnowledgeNode = { ...baseFields(), ...data }
    await db.knowledgeNodes.add(node)
    return node
  },

  async update(id: string, data: Partial<KnowledgeNode>): Promise<void> {
    await db.knowledgeNodes.update(id, { ...data, updatedAt: now() })
  },

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.knowledgeNodes, db.knowledgeEdges, db.links], async () => {
      await db.knowledgeNodes.delete(id)
      await db.knowledgeEdges.filter(e => e.fromNodeId === id || e.toNodeId === id).delete()
      await db.links.where('fromId').equals(id).delete()
      await db.links.where('toId').equals(id).delete()
    })
  },

  async deleteDemoData(): Promise<void> {
    await db.knowledgeNodes.filter(item => item.isDemo === true).delete()
  },
}

// === Knowledge Edge Repository (M6) ===
export const knowledgeEdgeRepo = {
  async getAll(): Promise<KnowledgeEdge[]> {
    return db.knowledgeEdges.toArray()
  },

  async getByNode(nodeId: string): Promise<KnowledgeEdge[]> {
    return db.knowledgeEdges.filter(e => e.fromNodeId === nodeId || e.toNodeId === nodeId).toArray()
  },

  async create(data: Omit<KnowledgeEdge, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeEdge> {
    const edge: KnowledgeEdge = {
      id: uuidv4(),
      createdAt: now(),
      updatedAt: now(),
      ...data,
    }
    await db.knowledgeEdges.add(edge)
    return edge
  },

  async delete(id: string): Promise<void> {
    await db.knowledgeEdges.delete(id)
  },

  async deleteDemoData(): Promise<void> {
    await db.knowledgeEdges.filter(item => item.isDemo === true).delete()
  },
}

// === Question Repository (M4) ===
export const questionRepo = {
  async getAll(): Promise<Question[]> {
    return db.questions.orderBy('createdAt').reverse().toArray()
  },

  async getBySubject(subjectId: string): Promise<Question[]> {
    return db.questions.where('subjectId').equals(subjectId).reverse().sortBy('createdAt')
  },

  async getByTopic(topicId: string): Promise<Question[]> {
    return db.questions.where('topicId').equals(topicId).toArray()
  },

  async getById(id: string): Promise<Question | undefined> {
    return db.questions.get(id)
  },

  async create(data: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<Question> {
    const question: Question = { ...baseFields(), ...data }
    await db.questions.add(question)
    return question
  },

  async update(id: string, data: Partial<Question>): Promise<void> {
    await db.questions.update(id, { ...data, updatedAt: now() })
  },

  async delete(id: string): Promise<void> {
    await db.questions.delete(id)
  },

  async deleteDemoData(): Promise<void> {
    await db.questions.filter(item => item.isDemo === true).delete()
  },
}

// === ExamAttempt Repository (M4) ===
export const examAttemptRepo = {
  async getAll(): Promise<ExamAttempt[]> {
    return db.examAttempts.orderBy('completedAt').reverse().toArray()
  },

  async getBySubject(subjectId: string): Promise<ExamAttempt[]> {
    return db.examAttempts.where('subjectId').equals(subjectId).reverse().sortBy('completedAt')
  },

  async getById(id: string): Promise<ExamAttempt | undefined> {
    return db.examAttempts.get(id)
  },

  async create(data: Omit<ExamAttempt, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExamAttempt> {
    const attempt: ExamAttempt = { ...baseFields(), ...data }
    await db.examAttempts.add(attempt)
    return attempt
  },

  async delete(id: string): Promise<void> {
    await db.examAttempts.delete(id)
  },

  async deleteDemoData(): Promise<void> {
    await db.examAttempts.filter(item => item.isDemo === true).delete()
  },
}

// === Formula Repository (M5) ===
export const formulaRepo = {
  async getAll(): Promise<Formula[]> {
    return db.formulas.orderBy('name').toArray()
  },

  async getByCategory(category: string): Promise<Formula[]> {
    return db.formulas.where('category').equals(category).toArray()
  },

  async getById(id: string): Promise<Formula | undefined> {
    return db.formulas.get(id)
  },

  async create(data: Omit<Formula, 'id' | 'createdAt' | 'updatedAt'>): Promise<Formula> {
    const formula: Formula = { ...baseFields(), ...data }
    await db.formulas.add(formula)
    return formula
  },

  async update(id: string, data: Partial<Formula>): Promise<void> {
    await db.formulas.update(id, { ...data, updatedAt: now() })
  },

  async delete(id: string): Promise<void> {
    await db.formulas.delete(id)
  },

  async deleteDemoData(): Promise<void> {
    await db.formulas.filter(item => item.isDemo === true).delete()
  },
}

// === CalcHistory Repository (M5) ===
export const calcHistoryRepo = {
  async getRecent(limit = 30): Promise<CalcHistoryItem[]> {
    return db.calcHistory.orderBy('createdAt').reverse().limit(limit).toArray()
  },

  async add(expression: string, result: string): Promise<CalcHistoryItem> {
    const item: CalcHistoryItem = {
      id: uuidv4(),
      expression,
      result,
      createdAt: now(),
    }
    await db.calcHistory.add(item)
    return item
  },

  async clear(): Promise<void> {
    await db.calcHistory.clear()
  },
}

// === Electronic Component Repository (M7) ===
export const componentRepo = {
  async getAll(): Promise<ElectronicComponent[]> {
    return db.electronicComponents.toArray()
  },

  async getById(id: string): Promise<ElectronicComponent | undefined> {
    return db.electronicComponents.get(id)
  },

  async getByCategory(category: ComponentCategory): Promise<ElectronicComponent[]> {
    return db.electronicComponents.where('category').equals(category).toArray()
  },

  async search(query: string): Promise<ElectronicComponent[]> {
    const q = query.toLowerCase().trim()
    if (!q) return db.electronicComponents.toArray()
    return db.electronicComponents
      .filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.package.toLowerCase().includes(q) ||
        item.pins.some(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      )
      .toArray()
  },

  async create(data: Omit<ElectronicComponent, 'id' | 'createdAt' | 'updatedAt'>): Promise<ElectronicComponent> {
    const item: ElectronicComponent = {
      ...data,
      id: uuidv4(),
      createdAt: now(),
      updatedAt: now(),
    }
    await db.electronicComponents.add(item)
    return item
  },

  async update(id: string, data: Partial<ElectronicComponent>): Promise<ElectronicComponent> {
    const existing = await db.electronicComponents.get(id)
    if (!existing) throw new Error(`Component ${id} not found`)
    const updated: ElectronicComponent = {
      ...existing,
      ...data,
      updatedAt: now(),
    }
    await db.electronicComponents.put(updated)
    return updated
  },

  async delete(id: string): Promise<void> {
    await db.electronicComponents.delete(id)
  },

  async deleteDemoData(): Promise<void> {
    await db.electronicComponents.filter(c => c.isDemo === true).delete()
  },
}

// === Xóa toàn bộ dữ liệu mẫu ===
export async function deleteAllDemoData(): Promise<void> {
  await db.transaction('rw', [
    db.subjects, db.topics, db.links, db.schedules,
    db.notebooks, db.sections, db.pages, db.noteVersions,
    db.mindmaps, db.knowledgeNodes, db.knowledgeEdges,
    db.questions, db.examAttempts, db.formulas, db.calcHistory,
    db.electronicComponents,
  ], async () => {
    await subjectRepo.deleteDemoData()
    await topicRepo.deleteDemoData()
    await linkRepo.deleteDemoData()
    await scheduleRepo.deleteDemoData()
    await notebookRepo.deleteDemoData()
    await sectionRepo.deleteDemoData()
    await pageRepo.deleteDemoData()
    await mindmapRepo.deleteDemoData()
    await knowledgeNodeRepo.deleteDemoData()
    await knowledgeEdgeRepo.deleteDemoData()
    await questionRepo.deleteDemoData()
    await examAttemptRepo.deleteDemoData()
    await formulaRepo.deleteDemoData()
    await componentRepo.deleteDemoData()

    // noteVersions của demo pages sẽ bị orphan - dọn dẹp
    const remainingPageIds = await db.pages.toCollection().primaryKeys()
    const allVersions = await db.noteVersions.toArray()
    const orphanVersionIds = allVersions
      .filter(v => !remainingPageIds.includes(v.pageId))
      .map(v => v.id)
    if (orphanVersionIds.length > 0) {
      await db.noteVersions.bulkDelete(orphanVersionIds)
    }
  })
}
