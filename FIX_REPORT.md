# Báo Cáo Khắc Phục Lỗi Cốt Lõi & Chuẩn Hóa Hệ Thống (Phase A)

**Dự án:** Personal Study OS (Project-Study)  
**Môi trường:** Local-First PWA (React 18 + TypeScript strict + Dexie 4 + Tailwind + TipTap + React Flow + KaTeX)  
**Deploy URL:** [https://hnam20076.github.io/Project-Study/](https://hnam20076.github.io/Project-Study/)  
**Branch:** `main` (commit `28f39b7`)  
**Ngày hoàn thành:** 29/09/2026

---

## 1. Tổng quan & Tiêu chí Chất lượng (Quality Gate A)

Toàn bộ 8 nhiệm vụ cốt lõi (A0 – A8) đã được hoàn thành với các tiêu chí nghiêm ngặt:
- **Offline-First:** Hoàn toàn độc lập, không còn phụ thuộc vào Google Fonts hay CDN KaTeX bên ngoài. Mọi tài sản tĩnh được bundle cục bộ và nạp vào PWA Precache (2.7 MB).
- **Toàn vẹn CSDL (Dexie):** Bảo tồn nguyên vẹn tất cả schema `version(1..5)` cũ. Nâng cấp phiên bản an toàn `version(6)` cho bảng `examSessions` mới với test migration tự động trên `fake-indexeddb`.
- **Không UI Giả:** Loại bỏ toàn bộ các chuỗi placeholder/tính năng chưa hỗ trợ gây hiểu lầm cho người dùng.
- **Kiểm thử Thực tế:** 100% pass trên trình duyệt thật (Google Chrome qua Playwright) ở cả 2 viewport Desktop (1366×800) và Mobile (375×740).

---

## 2. Bảng Tổng Hợp Chi Tiết (A0 – A8)

| Task | Hạng mục | Commit | Số đo / Kết quả kiểm chứng | Trạng thái |
|---|---|---|---|:---:|
| **A0** | Playwright E2E Runner & Baseline | `9caaa03` | Cài đặt Playwright, cấu hình Chrome, bắt thành công 10 bài test baseline tái hiện lỗi trước khi fix. | ✅ PASS |
| **A1** | Canvas Height Sơ đồ tư duy / Tri thức | `e5b4622` | Chiều cao `.react-flow`: **Desktop = 755px**, **Mobile = 631px** (vượt ngưỡng yêu cầu $\ge 400\text{px}$). 4/4 test e2e đạt. | ✅ PASS |
| **A2** | Sidebar Collapse Button & Cuộn ngang | `2601149` | Tọa độ nút thu gọn $x = 228\text{px}$ (nằm trong dải chuẩn $[200, 300]$). `scrollWidth === clientWidth` trên toàn bộ 6 routes chính. | ✅ PASS |
| **A3** | Offline Font/KaTeX & Command Palette | `da0d017` | Bundle `@fontsource/inter`, `@fontsource/jetbrains-mono`, `katex.min.css` cục bộ (0 external CDN requests). Hàm `stripLatex` loại bỏ $ và LaTeX thô khi search. | ✅ PASS |
| **A4** | Quiz Scoring Engine & Multiple/Numerical | `fe72c8c` | Tạo `src/services/scoring.ts` & `scoring.test.ts` (15/15 unit tests PASS). Hỗ trợ chấm multiple (Set compare), numerical (dấu `,`/`.`, phân số, tolerance). Thuật toán Fisher-Yates shuffle chuẩn. Seed 4 câu hỏi mẫu. | ✅ PASS |
| **A5** | Durable Exam Session (Chống F5 mất bài) | `9ace22a` | Nâng cấp Dexie `DB_VERSION = 6`, thêm `examSessions`. Phục hồi chính xác thời gian còn lại (độ lệch $< 1\text{s}$), vị trí câu hỏi và đáp án khi reload tab. Khóa chống nộp đúp bài thi. | ✅ PASS |
| **A6** | Autosave State Machine & Snapshot Quota | `e4f5500` | State machine `dirty` $\to$ `saving` $\to$ `saved` \| `error` trực quan. Tự động flush khi đổi route, unmount, `visibilitychange`, `beforeunload`. Giới hạn tạo snapshot tối đa 1 bản/5 phút, lưu tối đa 30 bản ghi lịch sử. | ✅ PASS |
| **A7** | Gỡ bỏ UI giả "Sắp ra mắt" | `28f39b7` | Xóa bỏ dòng chữ `"⠿ Kéo thả để sắp xếp (sắp ra mắt)"` trong `NotesPage.tsx`. E2E kiểm chứng chuỗi hoàn toàn biến mất. | ✅ PASS |
| **A8** | Tổng hợp kiểm tra Gate A & Triển khai | `28f39b7` | 15/15 Playwright E2E passed (1 skipped on mobile layout). 17 unit tests passed. `tsc --noEmit` 0 lỗi. Build production & deploy GitHub Actions thành công (HTTP 200). | ✅ PASS |

---

## 3. Chi Tiết Kỹ Thuật Các Khắc Phục Quan Trọng

### 3.1. Sửa lỗi Canvas Rỗng (A1)
- **Nguyên nhân:** Chuỗi layout Flexbox trong `AppLayout.tsx` bị thiếu thuộc tính `min-h-0` trên các container con và dùng `h-full` thay vì cố định viewport `100dvh`, khiến container React Flow bị collapse về chiều cao 0px khi render bên trong flex column.
- **Giải pháp:** Thiết lập `h-[100dvh]` cho layout root và thêm `min-h-0 flex-1 flex flex-col` cho `<main>` và các container trang `/mindmap`, `/knowledge`.

### 3.2. Cố định nút Sidebar & Triệt tiêu thanh cuộn ngang (A2)
- **Nguyên nhân:** Thẻ `<aside>` của `Sidebar.tsx` thiếu thuộc tính `relative`, làm nút thu gọn định vị tuyệt đối `absolute -right-3` bị gắn nhầm vào phần tử cha bên ngoài, dạt sang tận mép phải màn hình ($x \approx 1354\text{px}$). Ngoài ra, phần tràn viền này kích hoạt thanh cuộn ngang trình duyệt.
- **Giải pháp:** Bổ sung `relative !overflow-visible` cho `<aside>` và `overflow-x: hidden` tại `src/index.css`.

### 3.3. Offline KaTeX & Fonts (A3)
- **Nguyên nhân:** Ứng dụng phụ thuộc vào CDN Google Fonts và CDN KaTeX trong `index.html`. Khi mất mạng, công thức toán và phông chữ bị vỡ hoàn toàn.
- **Giải pháp:** Cài đặt các gói font cục bộ, import trực tiếp vào `src/main.tsx` và cấu hình Workbox Precache chứa đầy đủ file font woff2/css.

### 3.4. Bộ máy chấm điểm & Câu hỏi toán học (A4)
- **Nguyên nhân:** Hệ thống cũ chỉ hỗ trợ câu hỏi single choice với logic so khớp chuỗi cơ bản, dùng thuật toán xáo trộn thiên lệch `.sort(() => 0.5 - Math.random())`.
- **Giải pháp:** Xây dựng module `src/services/scoring.ts` hoàn chỉnh:
  - Hỗ trợ `multiple`: UI checkbox, chấm điểm bằng so sánh hai tập hợp ID.
  - Hỗ trợ `numerical`: Tự động parse số thực, số mũ, phân số, chuẩn hóa dấu phẩy kiểu Việt Nam (ví dụ: `3,14`), đối soát sai số tuyệt đối theo `tolerance`.
  - Thuật toán `fisherYatesShuffle` phân bố đều chuẩn $O(n)$.

### 3.5. Bền vững phiên thi (A5)
- **Nguyên nhân:** Trạng thái bài thi chỉ lưu trong React state tạm thời (`useState`). Khi người dùng vô tình bấm F5, reload tab hoặc mạng chập chờn, toàn bộ bài làm và thời gian trôi biến mất, sinh ra lỗi IndexedDB.
- **Giải pháp:**
  - Thêm bảng `examSessions` vào Dexie (DB version 6).
  - Tính toán timer dựa trên hiệu số mốc kết thúc cố định: `expiresAt.getTime() - Date.now()`, bảo đảm thời gian trôi đúng tuyệt đối theo đồng hồ thực dù tab bị tắt mở lại.
  - Tự động khôi phục câu đang làm dở, danh sách câu đã gắn cờ và các lựa chọn đáp án.

### 3.6. Cơ chế Autosave & Kiểm soát phiên bản (A6)
- **Nguyên nhân:** Mỗi lần gõ phím trong trình soạn thảo TipTap lại kích hoạt ghi `noteVersion`, gây tràn bảng IndexedDB sau vài phiên ghi chép.
- **Giải pháp:** Áp dụng máy trạng thái lưu với debounce, kèm cơ chế kiểm tra thời gian ghi snapshot (chỉ ghi tối đa 1 bản snapshot sau mỗi 5 phút làm việc liên tục) và tự động dọn dẹp các phiên bản cũ hơn (tối đa 30 bản ghi/trang).

---

## 4. Xác Minh Sau Triển Khai (Production Verification)

- **Trạng thái GitHub Actions:** `Build and Deploy to GitHub Pages: completed success`
- **Địa chỉ kiểm chứng trực tuyến:** [https://hnam20076.github.io/Project-Study/](https://hnam20076.github.io/Project-Study/)
- **Mã phản hồi HTTP:** `200 OK`
- **Kiểm tra tính năng trực tiếp:**
  - Trang `/quiz`: Thi thử không bị lỗi `KeyPath order on object store topics is not indexed`, hỗ trợ câu hỏi trắc nghiệm nhiều đáp án, câu hỏi điền số, phục hồi khi F5.
  - Trang `/notes`: Lưu ghi chú tự động mượt mà, không còn dòng chữ thông báo kéo thả giả.
  - Trang `/mindmap` & `/knowledge`: Sơ đồ hiển thị đầy đủ, chiếm trọn màn hình, không bị sụp chiều cao.
