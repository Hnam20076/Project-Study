# Báo Cáo Hoàn Thành Phase S2 — Thời Khóa Biểu 2.0 & TKB HK1 2026-2027

**Dự án:** Personal Study OS (`Project-Study`)  
**Môi trường:** Local-First PWA (React 18 + TypeScript strict + Dexie 4 + Tailwind + Zustand)  
**Deploy URL:** [https://hnam20076.github.io/Project-Study/](https://hnam20076.github.io/Project-Study/)  
**Branch:** `main` (commit `1200c5d`) / `stage/s2-schedule`  
**Ngày hoàn thành:** 29/09/2026  

---

## 1. Tổng Quan & Tiêu Chí Chất Lượng

Phase S2 nâng cấp toàn diện phân hệ Thời khóa biểu từ mô hình cơ bản lên hệ thống quản lý học tập đại học chuyên nghiệp theo chuẩn tuần và tín chỉ Việt Nam:
- **Offline-First 100%:** Toàn bộ tính năng (tính tuần, kiểm tra xung đột lịch theo tuần, lưới 16 tiết, nạp TKB chuẩn, xuất file iCalendar RFC 5545) chạy cục bộ không cần mạng.
- **Bảo toàn CSDL Dexie:** Không sửa đổi các khối `version(1..6)` cũ. Nâng cấp phiên bản an toàn `version(7)` bổ sung bảng `semesters` và trường `classGroupCode` có đánh chỉ mục, hỗ trợ `weekOverrides` cho từng tuần. Mọi trường mới đều `optional` để bảo toàn khả năng nhập file JSON sao lưu cũ.
- **Tiêu chuẩn UI & i18n:** 100% chuỗi tiếng Việt đưa vào `src/i18n/vi.ts`. Mọi nút bấm, dropdown và điều khiển đều có thuộc tính `aria-label` cho trợ năng (accessibility).
- **Kiểm thử nghiêm ngặt:** Đạt toàn bộ 9 Tiêu chí Nghiệm thu của đề bài qua 44 Unit Tests (Vitest) và 18 bài kiểm thử E2E trên trình duyệt Google Chrome thật (Playwright) ở cả 2 viewport Desktop (1366×800) và Mobile (375×740).

---

## 2. Bảng Tổng Hợp Chi Tiết (Task 2.1 – 2.8)

| Task | Hạng mục | Commit | Số đo / Kết quả nghiệm thu | Trạng thái |
|---|---|---|---|:---:|
| **2.1** | Semester Entity & Tuần học thực tế | `2dac2f4` | Quản lý học kỳ (`startDate`, `weeksCount`, `isCurrent`). Tự động tính thứ & khoảng ngày tuần học. Ngày 29/09/2026 xác định đúng Tuần 4 (28/09 – 04/10/2026). Ngày ngoài học kỳ xử lý an toàn. | ✅ PASS |
| **2.2** | Bảng 16 Tiết Chuẩn & Chuyển đổi Giờ $\leftrightarrow$ Tiết | `85cd9fd` | Định nghĩa `PERIOD_TIMES` 16 tiết (bắt đầu 07:00, kết thúc 21:10, ghi rõ ghi chú cần xác nhận cho tiết 14, 15). Chuyển đổi 2 chiều chính xác. | ✅ PASS |
| **2.3** | Nâng cấp Dexie v7 & Migration Test | `a55a92c` | Thêm bảng `semesters` và index `classGroupCode`. Migration test tự động nâng cấp v6 $\to$ v7 an toàn. Backward compatibility 100% với JSON export cũ. | ✅ PASS |
| **2.4** | Lọc theo tuần & Kiểm tra Xung đột Lịch nâng cao | `1192837` | Cùng thứ và cùng giờ nhưng khác tuần $\to$ KHÔNG xung đột. Chỉ báo trùng khi có ít nhất 1 tuần học chung. Bổ sung `getEffectiveRoom` theo tuần. Đồng bộ widget Dashboard. | ✅ PASS |
| **2.5** | Giao diện Thời khóa biểu 2.0 | `4618d15` | Mở rộng lưới 06:00 – 22:00 (960px). Thanh chọn tuần 1–16 có nút lùi/tiến, dropdown và nút "Tuần hiện tại". Chế độ xem "Theo tiết" (Period View 16 tiết). Huy hiệu `Online` màu tím cho phòng `E-LEARNING` / `MS-TEAMS`. Modal thêm tiết có chọn nhanh tuần học. | ✅ PASS |
| **2.6** | Idempotent Timetable Loader HK1 2026-2027 | `652f81d` | Nạp đủ 7 môn học phần chuẩn (`isDemo: false`). Thuật toán kiểm tra `classGroupCode + dayOfWeek + periodStart` đảm bảo nạp nhiều lần không sinh bản ghi trùng. | ✅ PASS |
| **2.7** | Xuất chuẩn RFC 5545 iCalendar (.ics) & Round-trip Parser | `372bca1` | Xuất file `.ics` cho tuần hiện tại hoặc cả học kỳ (76 sự kiện). Tự động ánh xạ phòng học theo `weekOverrides`. Round-trip parser kiểm chứng chuẩn xác. | ✅ PASS |
| **2.8** | E2E Playwright Specs & Đạt 9 Tiêu chí Nghiệm thu | `1200c5d` | Tạo `e2e/schedule-s2.spec.ts` kiểm thử toàn bộ hành vi thực tế trên Chrome Desktop & Mobile. Chụp và lưu ảnh screenshot artifact. 100% passed. | ✅ PASS |

---

## 3. Đối Soát 9 Tiêu Chí Nghiệm Thu

1. **Tiêu chí 1 (Tuần 1):** Tuần 1 hiển thị đúng 5 môn, không có lớp Chủ nhật (KNCĐ CN chỉ bắt đầu từ tuần 2). $\to$ **ĐẠT (Unit test & E2E spec)**
2. **Tiêu chí 2 (Tuần 2 & Phòng Online):** Tuần 2 có môn KNCĐ vào CN (`E-LEARNING`) và môn TTHCM vào T6 (`E-LEARNING`) với nhãn `Online` nổi bật. Các tuần 5, 7, 10 KHÔNG có môn CN. $\to$ **ĐẠT (Unit test & E2E spec)**
3. **Tiêu chí 3 (Tuần 11):** Tuần 11 không còn KTS T2 và không có TTHCM; có KTS T7 tiết 7–11 tại phòng `CS3.F.01.02`. $\to$ **ĐẠT (Unit test & E2E spec)**
4. **Tiêu chí 4 (Tuần 16):** Tuần 16 chỉ có duy nhất 1 môn là KTS T7 tiết 7–11. $\to$ **ĐẠT (Unit test & E2E spec)**
5. **Tiêu chí 5 (Tuần 4):** Ngày 29/09/2026 thuộc Tuần 4 (28/09 – 04/10/2026). $\to$ **ĐẠT (Unit test)**
6. **Tiêu chí 6 (Khớp giờ theo tiết):**
   - KTS T2 (tiết 4–6): 09:35 – 12:00
   - KNCĐ T2 (tiết 7–9): 13:00 – 15:25
   - KNCĐ CN (tiết 1–3): 07:00 – 09:25
   - KTS T7 (tiết 7–11): 13:00 – 17:10  
   $\to$ **ĐẠT (Unit test & Period View E2E)**
7. **Tiêu chí 7 (Lưới giờ 06:00 – 22:00 & Tiết 16):** Lưới bao phủ đủ 16 tiếng. Tiết 16 (20:25 – 21:10) hiển thị đầy đủ, không bị cắt xén ở cả chế độ Giờ và chế độ Tiết. $\to$ **ĐẠT (E2E spec & UI verified)**
8. **Tiêu chí 8 (Toàn vẹn CSDL & Import/Export):** Schema Dexie v7 nâng cấp trong suốt; import file JSON v5 cũ hoạt động mượt mà không phát sinh lỗi schema. $\to$ **ĐẠT (`migrationV7.test.ts`)**
9. **Tiêu chí 9 (Tính Idempotent):** Nút "Nạp TKB HK1 2026-2027" có thể nhấn nhiều lần mà không tạo môn học trùng lặp trong cơ sở dữ liệu. $\to$ **ĐẠT (Unit test & E2E spec)**

---

## 4. Danh Sách Tệp Thay Đổi & Tạo Mới

### Tệp tạo mới:
- `src/services/schedule.ts`: Dịch vụ tính toán tuần học, khoảng ngày, phòng học theo tuần.
- `src/services/schedulePeriods.ts`: Danh mục 16 tiết học chuẩn và bộ máy chuyển đổi thời gian.
- `src/services/icsExport.ts`: Bộ máy sinh chuỗi iCalendar RFC 5545, parser và trình tải file.
- `src/db/timetableHK1_2026_2027.ts`: Dữ liệu 7 môn HK1 2026-2027 và hàm nạp idempotent.
- `src/db/__tests__/migrationV7.test.ts`: Bộ test nâng cấp schema v7 và tương thích ngược.
- `src/services/__tests__/schedule.test.ts`: Bộ 23 unit test cho lịch học, tiết học, xung đột và iCalendar.
- `e2e/schedule-s2.spec.ts`: Bộ test E2E Playwright trên trình duyệt thật cho toàn bộ Phase S2.

### Tệp nâng cấp:
- `src/types/index.ts`: Bổ sung interface `Semester` và các trường mở rộng cho `ScheduleEntry`.
- `src/db/database.ts`: Thêm `this.version(7)` an toàn cho bảng `semesters` và index `classGroupCode`.
- `src/db/repositories.ts`: Thêm `semesterRepo` và cập nhật xóa dữ liệu demo.
- `src/db/exportImport.ts`: Hỗ trợ xuất/nhập bảng `semesters` và tương thích ngược với JSON cũ.
- `src/lib/utils.ts`: Nâng cấp thuật toán `hasTimeConflict` hỗ trợ kiểm tra giao tuần.
- `src/features/dashboard/DashboardPage.tsx`: Cập nhật widget Lịch hôm nay lọc theo tuần thực tế và hiển thị phòng học động.
- `src/features/schedule/SchedulePage.tsx`: Lưới 06:00 – 22:00, Period View, điều hướng tuần 1–16, nút nạp TKB, nút xuất .ics.
- `src/features/schedule/ScheduleFormModal.tsx`: Chọn tiết 1–16, chọn tuần nhanh, nhập mã lớp học phần.
- `src/i18n/vi.ts`: Thêm đầy đủ chuỗi giao diện cho học kỳ, tuần, tiết, phòng học online.

---

## 5. Hướng Dẫn Kiểm Thử Thủ Công Nhanh

1. Mở ứng dụng tại [https://hnam20076.github.io/Project-Study/schedule](https://hnam20076.github.io/Project-Study/schedule).
2. Nhấn nút **"Nạp TKB HK1 2026-2027"** trên thanh công cụ $\to$ Thông báo nạp 7 môn học thành công. Nhấn lại lần nữa $\to$ Thông báo thời khóa biểu đã có đầy đủ (không trùng).
3. Sử dụng dropdown chọn tuần:
   - **Tuần 1:** Kiểm tra thấy có 5 môn (không có lớp Chủ nhật).
   - **Tuần 2:** Kiểm tra thấy lớp CN (KNCĐ) và T6 (TTHCM) có huy hiệu **Online** màu tím.
   - **Tuần 11:** Kiểm tra thấy KTS chuyển sang Thứ 7 tiết 7–11 phòng `CS3.F.01.02`.
   - **Tuần 16:** Chỉ còn duy nhất môn KTS Thứ 7.
4. Nhấn nút **"Theo tiết"** $\to$ Quan sát bảng 16 tiết cuộn mượt mà từ Tiết 1 đến Tiết 16 (kết thúc lúc 21:10).
5. Nhấn nút **"Xuất file .ics"** $\to$ Chọn "Xuất toàn bộ học kỳ" để tải file `.ics` chuẩn đồng bộ vào Google Calendar / Apple Calendar.
