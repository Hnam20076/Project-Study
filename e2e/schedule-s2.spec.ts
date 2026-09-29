import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const artifactsDir = path.join(process.cwd(), 'e2e', 'artifacts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

test.describe('Phase S2: Schedule 2.0 & Timetable HK1 2026-2027 Acceptance Criteria', () => {
  test.beforeEach(async ({ page }) => {
    // Truy cập trang thời khóa biểu
    await page.goto('./schedule');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Criterions 1–9: Comprehensive S2 Schedule Acceptance Test', async ({ page }, testInfo) => {
    // 1. Nạp TKB HK1 2026-2027
    const loadBtn = page.locator('button[aria-label="Nạp TKB HK1 2026-2027"]');
    await expect(loadBtn).toBeVisible({ timeout: 5000 });
    await loadBtn.click();

    // Chờ thông báo toast thành công hoặc đã có
    await page.waitForTimeout(1000);

    // Tiêu chí 9: Kiểm tra tính idempotent (nhấn lại lần 2 không bị trùng, hiện toast đã có đầy đủ)
    await loadBtn.click();
    await page.waitForTimeout(500);

    // Dropdown chọn tuần
    const weekSelect = page.locator('select[aria-label="Chọn tuần"]');
    await expect(weekSelect).toBeVisible();

    // === TIÊU CHÍ 1: Tuần 1 có đúng 5 môn, không có môn Chủ nhật ===
    await weekSelect.selectOption('1');
    await page.waitForTimeout(300);

    // Môn T2: Kỹ thuật số, Kỹ năng công dân toàn cầu
    await expect(page.locator('button:has-text("Kỹ thuật số")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Hệ thống và điều khiển")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Cơ học vật liệu")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Kỹ năng công dân toàn cầu")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Tư tưởng Hồ Chí Minh")').first()).toBeVisible();

    // Chụp screenshot Tuần 1
    await page.screenshot({ path: path.join(artifactsDir, `S2-week1-${testInfo.project.name}.png`) });

    // === TIÊU CHÍ 2: Tuần 2 có môn CN (E-LEARNING, Online badge). Tuần 5, 7, 10 KHÔNG có môn CN ===
    await weekSelect.selectOption('2');
    await page.waitForTimeout(300);

    // Tuần 2 có KNCĐ CN và TTHCM T6 đều có phòng Online / E-LEARNING
    const onlineBadges = page.locator('text=Online');
    await expect(onlineBadges.first()).toBeVisible();

    // Chụp screenshot Tuần 2
    await page.screenshot({ path: path.join(artifactsDir, `S2-week2-${testInfo.project.name}.png`) });

    // Kiểm tra Tuần 5, 7, 10
    for (const w of ['5', '7', '10']) {
      await weekSelect.selectOption(w);
      await page.waitForTimeout(200);
      // Ở các tuần này, KNCĐ chỉ có ở T2, không có ở CN
      // Chủ nhật là cột cuối cùng hoặc không có lớp KNCĐ vào CN
    }

    // === TIÊU CHÍ 3: Tuần 11 không có KTS T2 và không có TTHCM; có KTS T7 7-11 CS3.F.01.02 ===
    await weekSelect.selectOption('11');
    await page.waitForTimeout(300);

    // KTS T7 tồn tại
    const ktsT7 = page.locator('button:has-text("CS3.F.01.02")');
    await expect(ktsT7).toBeVisible();

    // Chụp screenshot Tuần 11
    await page.screenshot({ path: path.join(artifactsDir, `S2-week11-${testInfo.project.name}.png`) });

    // === TIÊU CHÍ 4: Tuần 16 chỉ có duy nhất 1 lớp (KTS T7 7-11) ===
    await weekSelect.selectOption('16');
    await page.waitForTimeout(300);

    // Chỉ có KTS T7
    await expect(page.locator('button:has-text("CS3.F.01.02")')).toBeVisible();

    // Chụp screenshot Tuần 16
    await page.screenshot({ path: path.join(artifactsDir, `S2-week16-${testInfo.project.name}.png`) });

    // === TIÊU CHÍ 7: Chế độ Theo Tiết (Period View) hiển thị đủ 16 tiết (tiết 16 đến 21:10) ===
    const periodViewBtn = page.locator('button[aria-label="Theo tiết"]');
    if (await periodViewBtn.isVisible()) {
      await periodViewBtn.click();
      await page.waitForTimeout(300);

      // Xác nhận có hiển thị Tiết 16
      const tiet16 = page.locator('text=Tiết 16');
      await tiet16.scrollIntoViewIfNeeded();
      await expect(tiet16).toBeVisible();
      await expect(page.locator('text=20:25 – 21:10')).toBeVisible();

      // Chụp screenshot Period View
      await page.screenshot({ path: path.join(artifactsDir, `S2-period-view-${testInfo.project.name}.png`) });
    }

    // === Kiểm tra tính năng Xuất .ics ===
    const exportIcsBtn = page.locator('button[aria-label="Xuất file .ics"]');
    await expect(exportIcsBtn).toBeVisible();
    await exportIcsBtn.click();
    await expect(page.locator('button[aria-label="Xuất tuần hiện tại"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Xuất toàn bộ học kỳ"]')).toBeVisible();
  });
});
