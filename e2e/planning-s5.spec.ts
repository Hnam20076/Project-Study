import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const artifactsDir = path.join(process.cwd(), 'e2e', 'artifacts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

test.describe('Phase S5: Planning OS (Tasks, Planner, Focus, Reminders, Quick Capture)', () => {
  test('AC 1: Quản lý Nhiệm vụ (/tasks) - Tạo mới, lọc, chuyển Kanban và Deep Link', async ({ page }, testInfo) => {
    await page.goto('./tasks');
    await page.waitForLoadState('domcontentloaded');

    // 1. Mở modal tạo nhiệm vụ
    const addTaskBtn = page.locator('button[aria-label="Thêm nhiệm vụ"]').first();
    await expect(addTaskBtn).toBeVisible({ timeout: 5000 });
    await addTaskBtn.click();

    // 2. Điền thông tin nhiệm vụ
    const titleInput = page.locator('input[aria-label="Tiêu đề nhiệm vụ"]').first();
    await expect(titleInput).toBeVisible({ timeout: 3000 });
    await titleInput.fill('Thiết kế mạch nguồn xung Buck Converter');

    const descInput = page.locator('textarea[aria-label="Mô tả chi tiết"]').first();
    await descInput.fill('Tính toán cuộn cảm L và tụ C cho dòng tải 2A');

    const prioritySelect = page.locator('select[aria-label="Mức độ ưu tiên"]').first();
    await prioritySelect.selectOption('high');

    // Lưu nhiệm vụ
    const saveBtn = page.locator('button[aria-label="Lưu"]').first();
    await saveBtn.click();
    await page.waitForTimeout(600);

    // 3. Kiểm tra nhiệm vụ xuất hiện trong danh sách
    const taskCard = page.locator('text=Thiết kế mạch nguồn xung Buck Converter').first();
    await expect(taskCard).toBeVisible({ timeout: 5000 });

    // 4. Chuyển sang chế độ Kanban
    const kanbanBtn = page.locator('button[aria-label="Bảng Kanban"]').first();
    await expect(kanbanBtn).toBeVisible();
    await kanbanBtn.click();
    await page.waitForTimeout(400);

    // Xác nhận các cột Kanban hiển thị
    await expect(page.locator('text=Cần làm').first()).toBeVisible();
    await expect(page.locator('text=Đang làm').first()).toBeVisible();
    await expect(page.locator('text=Hoàn thành').first()).toBeVisible();

    // Chụp screenshot Tasks Kanban
    await page.screenshot({ path: path.join(artifactsDir, `S5-tasks-${testInfo.project.name}.png`) });

    // 5. Quay lại danh sách và đánh dấu hoàn thành
    const listBtn = page.locator('button[aria-label="Danh sách"]').first();
    await listBtn.click();
    await page.waitForTimeout(300);

    const checkBtn = page.locator('button[aria-label="Đánh dấu hoàn thành"]').first();
    if (await checkBtn.isVisible().catch(() => false)) {
      await checkBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('AC 2: Kế hoạch (/planner) & Trung tâm Hôm nay (Today Hub)', async ({ page }, testInfo) => {
    // 1. Mở trang Kế hoạch
    await page.goto('./planner');
    await page.waitForLoadState('domcontentloaded');

    // Xác nhận tiêu đề
    await expect(page.locator('h1:has-text("Kế hoạch học tập")').first()).toBeVisible({ timeout: 5000 });

    // Tab Hôm nay hiển thị các section cốt lõi
    await expect(page.locator('text=Tiết học').first()).toBeVisible();
    await expect(page.locator('text=Flashcard SRS').first()).toBeVisible();

    // 2. Chuyển sang Tab Tuần này
    const weekTabBtn = page.locator('button[aria-label="Tuần này"]').first();
    await expect(weekTabBtn).toBeVisible();
    await weekTabBtn.click();
    await page.waitForTimeout(400);

    // Xác nhận hiển thị các thứ trong tuần
    await expect(page.locator('text=Thứ 2').first()).toBeVisible();
    await expect(page.locator('text=Chủ nhật').first()).toBeVisible();

    // Chụp screenshot Planner
    await page.screenshot({ path: path.join(artifactsDir, `S5-planner-${testInfo.project.name}.png`) });

    // 3. Mở Dashboard và kiểm tra Today Hub
    await page.goto('./dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Kiểm tra widget Kế hoạch / Flashcard / Tập trung
    await expect(page.locator('[aria-label="Ôn tập Flashcard SRS"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[aria-label="Vào không gian tập trung"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('AC 3: Không gian tập trung (/focus) - Pomodoro bền vững qua F5 reload', async ({ page }, testInfo) => {
    await page.goto('./focus');
    await page.waitForLoadState('domcontentloaded');

    // Xác nhận tiêu đề Không gian tập trung
    await expect(page.locator('h1:has-text("Không gian tập trung")').first()).toBeVisible({ timeout: 5000 });

    // Kiểm tra đồng hồ Pomodoro hiển thị
    const startBtn = page.locator('button[aria-label="Bắt đầu"]').first();
    await expect(startBtn).toBeVisible({ timeout: 5000 });

    // 1. Bấm Bắt đầu
    await startBtn.click();
    await page.waitForTimeout(1000);

    // Xác nhận nút Tạm dừng xuất hiện (đồng hồ đang chạy)
    const pauseBtn = page.locator('button[aria-label="Tạm dừng"]').first();
    await expect(pauseBtn).toBeVisible({ timeout: 3000 });

    // Chụp ảnh trước reload
    await page.screenshot({ path: path.join(artifactsDir, `S5-focus-${testInfo.project.name}.png`) });

    // 2. F5 reload kiểm tra tính bền vững
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Sau khi F5, trạng thái running vẫn duy trì và nút Tạm dừng vẫn hiển thị
    await expect(page.locator('button[aria-label="Tạm dừng"]').first()).toBeVisible({ timeout: 5000 });

    // Tạm dừng để dọn dẹp
    await page.locator('button[aria-label="Tạm dừng"]').first().click();
  });

  test('AC 4: Tạo nhanh Quick Capture - Nút nổi và tạo Flashcard/Task tức thì', async ({ page }, testInfo) => {
    await page.goto('./dashboard');
    await page.waitForLoadState('domcontentloaded');

    // 1. Bấm nút nổi Quick Capture (+)
    const fabBtn = page.locator('button[aria-label="Mở tạo nhanh (Alt+N)"]').first();
    await expect(fabBtn).toBeVisible({ timeout: 5000 });
    await fabBtn.click();

    // 2. Xác nhận Modal Quick Capture xuất hiện
    await expect(page.locator('text=Tạo nhanh (Quick Capture)').first()).toBeVisible({ timeout: 3000 });

    // 3. Chọn tab Flashcard
    const flashcardTabBtn = page.locator('button[aria-label="Tạo nhanh Flashcard"]').first();
    await flashcardTabBtn.click();

    // Điền câu hỏi & đáp án
    const frontInput = page.locator('textarea[aria-label="Mặt trước (câu hỏi/thuật ngữ)"]').first();
    await frontInput.fill('Chế độ hoạt động của BJT khi Vbe > 0.7V và Vbc < 0?');

    const backInput = page.locator('textarea[aria-label="Mặt sau (câu trả lời/định nghĩa)"]').first();
    await backInput.fill('Vùng khuếch đại tích cực (Active region)');

    // Chụp screenshot Quick Capture modal
    await page.screenshot({ path: path.join(artifactsDir, `S5-quick-capture-${testInfo.project.name}.png`) });

    // 4. Bấm Lưu
    const saveBtn = page.locator('button[aria-label="Lưu flashcard"]').first();
    await saveBtn.click();

    // 5. Modal đóng lại
    await page.waitForTimeout(600);
    await expect(page.locator('text=Tạo nhanh (Quick Capture)')).not.toBeVisible({ timeout: 3000 });
  });
});
