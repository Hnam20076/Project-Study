import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const artifactsDir = path.join(process.cwd(), 'e2e', 'artifacts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

async function ensureEditorOpen(page: Page) {
  const editor = page.locator('.tiptap-editor');
  try {
    await expect(editor).toBeVisible({ timeout: 8000 });
    return editor;
  } catch {
    // Fallback: click mở notebook và trang mẫu
    const mathNotebook = page.locator('button:has-text("Toán Kỹ Thuật")').first();
    if (await mathNotebook.isVisible({ timeout: 2000 }).catch(() => false)) {
      await mathNotebook.click();
      await page.waitForTimeout(300);
    }
    const chapter1 = page.locator('button:has-text("Chương 1")').first();
    if (await chapter1.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chapter1.click();
      await page.waitForTimeout(300);
    }
    const samplePage = page.locator('button:has-text("Quy tắc tính đạo hàm")').first();
    if (await samplePage.isVisible({ timeout: 2000 }).catch(() => false)) {
      await samplePage.click();
    }
  }

  await expect(editor).toBeVisible({ timeout: 10000 });
  return editor;
}

test.describe('Phase S3: Advanced Notes (KaTeX Math & Blob Images) Acceptance Criteria', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./notes');
    await page.waitForLoadState('domcontentloaded');
  });

  test('AC 1: Chèn công thức toán KaTeX Inline và Block, lưu và khôi phục khi F5 reload', async ({ page }, testInfo) => {
    const editor = await ensureEditorOpen(page);

    // Focus editor
    await editor.click();

    // 1. Chèn Inline Math
    const inlineMathBtn = page.locator('button[aria-label="Toán Inline (Σ)"]');
    await expect(inlineMathBtn).toBeVisible({ timeout: 5000 });
    await inlineMathBtn.click();

    // Popover nhập LaTeX inline xuất hiện
    const inlineInput = page.locator('.math-node-wrapper input');
    await expect(inlineInput).toBeVisible({ timeout: 5000 });
    await inlineInput.fill('E = mc^2');

    // Nhấn Áp dụng
    const applyBtn = page.locator('button[aria-label="Lưu công thức"]').first();
    await applyBtn.click();

    // Kiểm tra KaTeX inline đã render
    const katexInline = page.locator('.math-inline .katex');
    await expect(katexInline).toBeVisible({ timeout: 5000 });

    // 2. Chèn Block Math
    const blockMathBtn = page.locator('button[aria-label="Khối Toán (∑)"]');
    await expect(blockMathBtn).toBeVisible({ timeout: 5000 });
    await blockMathBtn.click();

    // Popover nhập LaTeX block xuất hiện
    const blockTextarea = page.locator('.math-node-wrapper textarea');
    await expect(blockTextarea).toBeVisible({ timeout: 5000 });
    await blockTextarea.fill('\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}');

    // Nhấn Áp dụng
    const applyBlockBtn = page.locator('button[aria-label="Lưu công thức"]').first();
    await applyBlockBtn.click();

    // Kiểm tra KaTeX block đã render
    const katexBlock = page.locator('.math-block .katex-display');
    await expect(katexBlock).toBeVisible({ timeout: 5000 });

    // Chờ debounce autosave hoàn tất
    await page.waitForTimeout(2000);

    // Chụp screenshot công thức KaTeX
    await page.screenshot({ path: path.join(artifactsDir, `S3-katex-${testInfo.project.name}.png`) });

    // 3. F5 Reload trang để kiểm tra tính bền vững
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    await ensureEditorOpen(page);

    // Kiểm tra các công thức vẫn tồn tại và render KaTeX sau khi reload
    await expect(page.locator('.math-inline .katex').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.math-block .katex-display').first()).toBeVisible({ timeout: 8000 });
  });

  test('AC 2: Tải lên ảnh, tối ưu hóa lưu Blob trong IndexedDB và hiển thị bền vững sau F5', async ({ page }, testInfo) => {
    await ensureEditorOpen(page);

    // Tạo file ảnh mẫu 10x10 pixel PNG
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FAAhKDveksOjuAAAAAElFTkSuQmCC',
      'base64'
    );

    // Upload qua input file ẩn của toolbar
    const fileInput = page.locator('input[aria-label="Tải lên ảnh ghi chú"]');
    await fileInput.setInputFiles({
      name: 'circuit-diagram.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    });

    // Chờ ảnh render trong editor (CustomImageView)
    const noteImg = page.locator('.tiptap-editor img').first();
    await expect(noteImg).toBeVisible({ timeout: 10000 });

    // Kiểm tra src của ảnh được tải qua blob: URL
    const src = await noteImg.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src?.startsWith('blob:') || src?.startsWith('idb:')).toBeTruthy();

    // Chờ autosave
    await page.waitForTimeout(2000);

    // Chụp screenshot ghi chú có ảnh
    await page.screenshot({ path: path.join(artifactsDir, `S3-image-${testInfo.project.name}.png`) });

    // F5 Reload để kiểm tra ảnh vẫn hiển thị
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    await ensureEditorOpen(page);

    const reloadedImg = page.locator('.tiptap-editor img').first();
    await expect(reloadedImg).toBeVisible({ timeout: 10000 });
  });
});
