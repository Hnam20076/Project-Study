import { describe, it, expect, vi } from 'vitest'
import { dataUrlToBlob, migrateNoteContentBase64 } from '../noteMigration'

describe('noteMigration', () => {
  it('dataUrlToBlob phân tích đúng mimeType và tạo Blob hợp lệ từ base64', () => {
    // 1x1 transparent PNG pixel base64
    const pngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const result = dataUrlToBlob(pngDataUrl)

    expect(result.mimeType).toBe('image/png')
    expect(result.blob).toBeInstanceOf(Blob)
    expect(result.blob.size).toBeGreaterThan(0)
  })

  it('migrateNoteContentBase64 trích xuất ảnh base64 và thay thế bằng idb://', async () => {
    const pngDataUrl1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const htmlWithImages = `
      <h1>Bài học Mạch số</h1>
      <p>Sơ đồ cổng logic:</p>
      <img src="${pngDataUrl1}" alt="Cổng AND" />
      <p>Kết thúc bài học.</p>
    `

    let generatedId = 1
    const mockSave = vi.fn().mockImplementation(async (pageId: string, blob: Blob, mime: string) => {
      return {
        id: `img-migrated-${generatedId++}`,
        pageId,
        blob,
        mimeType: mime,
      }
    })

    const { newContent, count } = await migrateNoteContentBase64(htmlWithImages, 'page-101', mockSave)

    expect(count).toBe(1)
    expect(mockSave).toHaveBeenCalledTimes(1)
    expect(newContent).toContain('src="idb://img-migrated-1"')
    expect(newContent).not.toContain('data:image/png;base64')
    expect(newContent).toContain('alt="Cổng AND"')
    expect(newContent).toContain('<h1>Bài học Mạch số</h1>')
  })

  it('không làm thay đổi nội dung nếu trang không có ảnh base64', async () => {
    const cleanHtml = '<p>Ghi chú chỉ có văn bản và công thức</p><img src="idb://existing-id" />'
    const mockSave = vi.fn()

    const { newContent, count } = await migrateNoteContentBase64(cleanHtml, 'page-102', mockSave)

    expect(count).toBe(0)
    expect(mockSave).not.toHaveBeenCalled()
    expect(newContent).toBe(cleanHtml)
  })
})
