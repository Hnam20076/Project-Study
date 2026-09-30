import { db } from '@/db/database'
import { imageRepo } from '@/db/repositories'

/**
 * Chuyển đổi chuỗi Data URL (data:image/...) thành Blob
 */
export function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } {
  const parts = dataUrl.split(',')
  const mimeMatch = parts[0]?.match(/:(.*?);/)
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'
  const base64Data = parts[1] || ''

  // Hỗ trợ cả browser atob và Node.js Buffer
  let binaryString: string
  if (typeof atob === 'function') {
    binaryString = atob(base64Data)
  } else if (typeof Buffer !== 'undefined') {
    binaryString = Buffer.from(base64Data, 'base64').toString('binary')
  } else {
    throw new Error('No base64 decoding mechanism available')
  }

  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  const blob = new Blob([bytes], { type: mimeType })
  return { blob, mimeType }
}

/**
 * Quét chuỗi HTML và di chuyển toàn bộ ảnh nhúng base64 sang kho lưu trữ Blob IndexedDB
 */
export async function migrateNoteContentBase64(
  content: string,
  pageId: string,
  saveFn = async (pId: string, blob: Blob, mime: string) => {
    return await imageRepo.save(pId, blob, mime)
  }
): Promise<{ newContent: string; count: number }> {
  if (!content || !content.includes('data:image/')) {
    return { newContent: content, count: 0 }
  }

  // Regex tìm kiếm các URL base64 bên trong src="..."
  const regex = /src=["'](data:image\/[a-zA-Z0-9+.-]+;base64,[^"']+)["']/g
  let count = 0
  const matches: { fullMatch: string; dataUrl: string }[] = []

  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      dataUrl: match[1],
    })
  }

  let updatedContent = content
  for (const item of matches) {
    try {
      const { blob, mimeType } = dataUrlToBlob(item.dataUrl)
      const saved = await saveFn(pageId, blob, mimeType)
      updatedContent = updatedContent.replace(item.fullMatch, `src="idb://${saved.id}"`)
      count++
    } catch (err) {
      console.error('Failed to migrate base64 image in note:', err)
    }
  }

  return { newContent: updatedContent, count }
}

/**
 * Migration quét toàn bộ DB: trích xuất tất cả ảnh base64 trong các note cũ sang bảng noteImages
 */
export async function migrateAllNotesBase64Images(database = db): Promise<number> {
  const pages = await database.pages.toArray()
  let totalMigrated = 0

  for (const page of pages) {
    if (page.content && page.content.includes('data:image/')) {
      const { newContent, count } = await migrateNoteContentBase64(page.content, page.id)
      if (count > 0) {
        await database.pages.update(page.id, { content: newContent })
        totalMigrated += count
      }
    }
  }

  return totalMigrated
}
