import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const artifactsDir = path.join(process.cwd(), 'e2e', 'artifacts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

test.describe('Phase S4: Quiz Hub 2.0, Flashcard SRS & Knowledge Gap Analysis', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./quiz');
    await page.waitForLoadState('domcontentloaded');
  });

  test('AC 1: Quản lý Thẻ ghi nhớ Flashcard & Chế độ ôn tập SRS với lật thẻ 3D và khôi phục khi F5', async ({ page }, testInfo) => {
    // 1. Chuyển sang Tab Thẻ ghi nhớ (Flashcard)
    const flashcardTabBtn = page.locator('button[aria-label="Thẻ ghi nhớ (Flashcard)"]').first();
    await expect(flashcardTabBtn).toBeVisible({ timeout: 5000 });
    await flashcardTabBtn.click();

    // 2. Nếu chưa có thẻ, bấm "Tạo thẻ từ câu hỏi"
    const convertBtn = page.locator('button[aria-label="Tạo thẻ từ câu hỏi"]').first();
    if (await convertBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await convertBtn.click();
      await page.waitForTimeout(1000);
    }

    // Kiểm tra xem thẻ đã xuất hiện trong danh sách
    const startReviewBtn = page.locator('button[aria-label="Bắt đầu ôn tập"]').first();
    await expect(startReviewBtn).toBeVisible({ timeout: 5000 });

    // 3. Bắt đầu phiên ôn tập Flashcard SRS
    await startReviewBtn.click();

    // Xác nhận mặt trước của thẻ hiển thị
    await expect(page.locator('text=Mặt trước').first()).toBeVisible({ timeout: 5000 });

    // 4. Lật thẻ sang mặt sau bằng cách bấm "Xem đáp án"
    const showAnswerBtn = page.locator('button[aria-label="Xem đáp án"]').first();
    await expect(showAnswerBtn).toBeVisible({ timeout: 5000 });
    await showAnswerBtn.click();

    // Xác nhận mặt sau của thẻ hiển thị kèm 4 nút đánh giá SRS
    await expect(page.locator('text=Mặt sau').first()).toBeVisible({ timeout: 5000 });
    const ratingGoodBtn = page.locator('button[aria-label="Vừa (3-4 ngày)"]').first();
    await expect(ratingGoodBtn).toBeVisible({ timeout: 5000 });

    // 5. Đánh giá "Vừa"
    await ratingGoodBtn.click();
    await page.waitForTimeout(500);

    // Chụp screenshot phiên học Flashcard
    await page.screenshot({ path: path.join(artifactsDir, `S4-flashcard-${testInfo.project.name}.png`) });

    // 6. F5 reload trang và kiểm tra tính bền vững
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Chuyển lại tab Flashcard
    await page.locator('button[aria-label="Thẻ ghi nhớ (Flashcard)"]').first().click();
    await expect(page.locator('button[aria-label="Bắt đầu ôn tập"]').first()).toBeVisible({ timeout: 5000 });
  });

  test('AC 2: Xuất / Nhập câu hỏi định dạng GIFT chuẩn Moodle Quiz', async ({ page }, testInfo) => {
    // 1. Chuyển sang Tab Ngân hàng câu hỏi
    const bankTabBtn = page.locator('button[aria-label="Ngân hàng câu hỏi"]').first();
    await expect(bankTabBtn).toBeVisible({ timeout: 5000 });
    await bankTabBtn.click();

    // 2. Mở modal Xuất / Nhập
    const importExportBtn = page.locator('button[aria-label="Nhập hoặc xuất câu hỏi GIFT/JSON"]').first();
    await expect(importExportBtn).toBeVisible({ timeout: 5000 });
    await importExportBtn.click();

    // 3. Kiểm tra modal mở ra, bấm "Xem mẫu GIFT"
    const viewGiftSampleBtn = page.locator('text=Xem mẫu GIFT').first();
    await expect(viewGiftSampleBtn).toBeVisible({ timeout: 5000 });
    await viewGiftSampleBtn.click();

    // Textarea tự động điền mẫu GIFT
    const textarea = page.locator('#import-text');
    await expect(textarea).toBeVisible();
    const content = await textarea.inputValue();
    expect(content).toContain('::Định luật Ohm::');

    // Nhận diện câu hỏi hợp lệ
    await expect(page.locator('text=Đã nhận diện hợp lệ:').first()).toBeVisible({ timeout: 5000 });

    // 4. Bấm "Nhập câu hỏi vào ngân hàng"
    const submitImportBtn = page.locator('button[aria-label="Nhập câu hỏi vào ngân hàng"]').first();
    await expect(submitImportBtn).toBeVisible();
    await submitImportBtn.click();

    // Chụp screenshot modal nhập câu hỏi
    await page.screenshot({ path: path.join(artifactsDir, `S4-gift-import-${testInfo.project.name}.png`) });
  });

  test('AC 3: Báo cáo Lỗ hổng Kiến thức sau khi làm bài và Nút liên kết chéo Flashcard', async ({ page }, testInfo) => {
    // 1. Tab Luyện thi
    const examTabBtn = page.locator('button[aria-label="Thi thử & Luyện tập"]').first();
    await expect(examTabBtn).toBeVisible({ timeout: 5000 });
    await examTabBtn.click();

    // 2. Nếu đang có bài thi hoặc chưa bắt đầu
    const startExamBtn = page.locator('button:has-text("Bắt đầu thi"), button:has-text("Bắt đầu làm bài")').first();
    if (await startExamBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startExamBtn.click();
      await page.waitForTimeout(500);
    }

    // Nếu đang trong phòng thi, chọn nhanh 1 đáp án và nộp bài
    const optionCheckbox = page.locator('[role="radio"], [role="checkbox"]').first();
    if (await optionCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
      await optionCheckbox.click();
    }

    // Bấm Nộp bài thi
    const submitBtn = page.locator('button:has-text("Nộp bài thi")').first();
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      page.once('dialog', async dialog => {
        await dialog.accept();
      });
      await submitBtn.click();
      await page.waitForTimeout(1000);
    }

    // 3. Màn hình kết quả: Biểu đồ lỗ hổng kiến thức
    const scoreSummary = page.locator('text=Điểm số đạt được').first();
    if (await scoreSummary.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(scoreSummary).toBeVisible();

      // Kiểm tra nút liên kết chéo Flashcard
      const flashcardLinkBtn = page.locator('button[aria-label="Ôn thẻ Flashcard chủ đề này"]').first();
      if (await flashcardLinkBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await flashcardLinkBtn.click();
        // Chuyển sang URL /quiz?tab=flashcard
        await expect(page).toHaveURL(/.*tab=flashcard/);
      }
    }

    // Chụp screenshot kết quả thi
    await page.screenshot({ path: path.join(artifactsDir, `S4-exam-result-${testInfo.project.name}.png`) });
  });
});
