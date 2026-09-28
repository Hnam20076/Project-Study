import { db } from './database'
import type { NoteSection } from '@/types'

// Thêm hàm getAll vào sectionRepo (cần cho NotesPage)
export async function getAllSections(): Promise<NoteSection[]> {
  return db.sections.toArray()
}
