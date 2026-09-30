import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '../database'
import { imageRepo, pageRepo, sectionRepo, notebookRepo } from '../repositories'
import { exportAllData, importAllData } from '../exportImport'

describe('NoteImages Export/Import and Cascade Deletion', () => {
  beforeEach(async () => {
    await db.noteImages.clear()
    await db.pages.clear()
    await db.sections.clear()
    await db.notebooks.clear()
  })

  it('xóa trang (page) sẽ cascade xóa sạch các noteImages của trang đó', async () => {
    const notebook = await notebookRepo.create({ name: 'Sổ tay Vật lý', color: '#ff0000', order: 1, tags: [] })
    const section = await sectionRepo.create({ name: 'Chương 1', notebookId: notebook.id, order: 1, tags: [] })
    const page = await pageRepo.create({
      title: 'Định luật Ohm',
      content: '<p>Nội dung</p>',
      sectionId: section.id,
      notebookId: notebook.id,
      order: 1,
      tags: [],
    })

    const blob1 = new Blob(['test image 1'], { type: 'image/png' })
    const blob2 = new Blob(['test image 2'], { type: 'image/png' })
    await imageRepo.save(page.id, blob1, 'image/png', 'img1.png')
    await imageRepo.save(page.id, blob2, 'image/png', 'img2.png')

    const initialImages = await imageRepo.getByPage(page.id)
    expect(initialImages.length).toBe(2)

    // Xóa trang
    await pageRepo.delete(page.id)

    // Kiểm tra cascade
    const remainingImages = await imageRepo.getByPage(page.id)
    expect(remainingImages.length).toBe(0)
  })

  it('exportAllData bao gồm noteImages dưới dạng base64 và importAllData khôi phục trọn vẹn', async () => {
    const notebook = await notebookRepo.create({ name: 'Sổ tay Toán', color: '#00ff00', order: 1, tags: [] })
    const section = await sectionRepo.create({ name: 'Đại số', notebookId: notebook.id, order: 1, tags: [] })
    const page = await pageRepo.create({
      title: 'Ma trận',
      content: '<p>Định thức ma trận</p>',
      sectionId: section.id,
      notebookId: notebook.id,
      order: 1,
      tags: [],
    })

    const testBytes = new Uint8Array([1, 2, 3, 4, 5])
    const sampleBlob = new Blob([testBytes], { type: 'image/png' })
    const savedImg = await imageRepo.save(page.id, sampleBlob, 'image/png', 'matrix.png')

    // Xuất dữ liệu
    const exported = await exportAllData()
    expect(exported.noteImages).toBeDefined()
    expect(exported.noteImages?.length).toBe(1)
    expect(exported.noteImages?.[0].id).toBe(savedImg.id)
    expect(exported.noteImages?.[0].dataUrl).toContain('data:image/png;base64,')

    // Xóa sạch DB
    await db.noteImages.clear()
    await db.pages.clear()

    // Nhập lại từ JSON exported
    await importAllData(exported)

    // Kiểm tra phục hồi
    const restoredImages = await imageRepo.getByPage(page.id)
    expect(restoredImages.length).toBe(1)
    expect(restoredImages[0].id).toBe(savedImg.id)
    expect(restoredImages[0].blob).toBeInstanceOf(Blob)
    expect(restoredImages[0].blob.size).toBe(sampleBlob.size)
  })

  it('import dữ liệu cũ không có trường noteImages vẫn chạy thành công', async () => {
    const legacyExport = {
      version: 5,
      exportedAt: new Date().toISOString(),
      subjects: [],
      topics: [],
      links: [],
      schedules: [],
      notebooks: [],
      sections: [],
      pages: [],
      noteVersions: [],
      // Không có noteImages
    }

    await expect(importAllData(legacyExport)).resolves.not.toThrow()
  })
})
