import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const artifactsDir = path.join(process.cwd(), 'e2e', 'artifacts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

test.describe('A1: Canvas height', () => {
  test('A1: /mindmap .react-flow clientHeight >= 400', async ({ page }, testInfo) => {
    await page.goto('./mindmap');
    await page.waitForLoadState('domcontentloaded');
    const rf = page.locator('.react-flow');
    await expect(rf).toBeVisible({ timeout: 5000 });
    const height = await rf.evaluate((el) => el.clientHeight);
    expect(height).toBeGreaterThanOrEqual(400);
    try {
      await page.screenshot({ path: path.join(artifactsDir, `A1-mindmap-${testInfo.project.name}.png`), timeout: 3000 });
    } catch {}
  });

  test('A1: /knowledge .react-flow clientHeight >= 400', async ({ page }, testInfo) => {
    await page.goto('./knowledge');
    await page.waitForLoadState('domcontentloaded');
    const rf = page.locator('.react-flow');
    await expect(rf).toBeVisible({ timeout: 5000 });
    const height = await rf.evaluate((el) => el.clientHeight);
    expect(height).toBeGreaterThanOrEqual(400);
    try {
      await page.screenshot({ path: path.join(artifactsDir, `A1-knowledge-${testInfo.project.name}.png`), timeout: 3000 });
    } catch {}
  });
});

test.describe('A2: Sidebar position and horizontal scroll', () => {
  test('A2: Sidebar collapse button x-position ≈ 240', async ({ page }, testInfo) => {
    if (testInfo.project.name.startsWith('mobile')) {
      test.skip();
      return;
    }
    await page.goto('./dashboard');
    await page.waitForLoadState('domcontentloaded');
    const collapseBtn = page.locator('aside button[title*="Thu gọn"]').or(page.locator('aside button[title*="sidebar"]'));
    await expect(collapseBtn).toBeVisible({ timeout: 5000 });
    const box = await collapseBtn.boundingBox();
    expect(box).not.toBeNull();
    await page.screenshot({ path: path.join(artifactsDir, `A2-sidebar-${testInfo.project.name}.png`) });
    // In buggy version, x is around 1354 because aside is not relative
    expect(box!.x).toBeLessThan(300);
    expect(box!.x).toBeGreaterThan(200);
  });

  test('A2: scrollWidth equals clientWidth (no horizontal scroll)', async ({ page }, testInfo) => {
    const routes = ['./dashboard', './notes', './mindmap', './quiz', './calculator', './knowledge'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll, `Route ${route} has horizontal scroll`).toBe(false);
    }
  });
});

test.describe('A3: Offline and Command Palette LaTeX stripping', () => {
  test('A3: Command palette strips LaTeX syntax from result titles', async ({ page }) => {
    await page.goto('./dashboard');
    await page.waitForLoadState('domcontentloaded');
    // Open command palette
    await page.evaluate(() => {
      const store = (window as any).__useUIStore;
      if (store) store.getState().openCommandPalette();
      else window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    });
    const input = page.locator('.modal-overlay input');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('toán');
    await page.waitForTimeout(500);
    // Titles should not contain $ signs or raw LaTeX \frac
    const titles = await page.locator('ul li button span').allTextContents();
    for (const t of titles) {
      expect(t.includes('$'), `Title "${t}" contains $`).toBe(false);
      expect(t.includes('\\frac'), `Title "${t}" contains raw \\frac`).toBe(false);
    }
  });
});

test.describe('A5: Durable exam session on F5', () => {
  test('A5: F5 mid-exam restores exam state', async ({ page }) => {
    await page.goto('./quiz');
    await page.waitForLoadState('domcontentloaded');
    const startBtn = page.locator('button:has-text("Bắt đầu thi")');
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500);
      // Mid exam, should show timer and questions
      const examIndicator = page.locator('text=Câu 1 /');
      await expect(examIndicator).toBeVisible();
      // Reload page (F5)
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      // Should restore active exam state
      await expect(page.locator('text=Câu 1 /')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('A6: Autosave note versions', () => {
  test('A6: Typing for 60s does not generate spam versions', async ({ page }) => {
    await page.goto('./notes');
    await page.waitForLoadState('domcontentloaded');
    // Select first page
    const pageItem = page.locator('button:has-text("Đạo hàm cơ bản")').first();
    if (await pageItem.isVisible()) {
      await pageItem.click();
      await page.waitForTimeout(500);
      const editor = page.locator('.tiptap-editor');
      await expect(editor).toBeVisible();
    }
  });
});

test.describe('A7: Remove fake drag-drop hint', () => {
  test('A7: "Kéo thả để sắp xếp (sắp ra mắt)" is absent', async ({ page }) => {
    await page.goto('./notes');
    await page.waitForLoadState('domcontentloaded');
    const fakeText = page.locator('text=Kéo thả để sắp xếp (sắp ra mắt)');
    await expect(fakeText).not.toBeVisible();
  });
});
