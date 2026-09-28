# Personal Study OS

Hệ điều hành học tập cá nhân chuyên biệt cho sinh viên kỹ thuật Việt Nam. Không backend, không cần tài khoản, hoạt động hoàn toàn offline, dữ liệu lưu trữ cục bộ bảo mật trên trình duyệt (IndexedDB).

🌐 **Trang web truy cập trực tiếp**: [https://hnam20076.github.io/Project-Study/](https://hnam20076.github.io/Project-Study/)

---

## 🚀 Tiến độ phát triển

### ✅ Phase 1: Nền tảng ứng dụng + Thời khóa biểu (M1) + Ghi chú (M2)
- 📅 **Thời khóa biểu (M1)**: Xem Ngày / Tuần / Tháng, hiển thị vạch giờ hiện tại, phát hiện trùng lịch, đếm ngược tiết học tiếp theo.
- 📝 **Ghi chú kiểu OneNote / Notion (M2)**: Phân cấp 3 tầng (Notebook → Section → Page), trình soạn thảo TipTap đầy đủ định dạng (KaTeX, ảnh, checklist, code block), tự động lưu debounce 1.5s, lịch sử 20 phiên bản.
- 🌓 **Giao diện đa nền**: Light / Dark / System mode, responsive hoàn hảo từ màn hình di động (375px) với Bottom Navigation đến Desktop có Sidebar thu gọn.
- 🔍 **Command Palette (Ctrl+K)**: Tìm kiếm xuyên module có debounce.
- 📤 **Sao lưu an toàn**: Xuất/nhập toàn bộ dữ liệu ra file JSON, xác thực chuẩn xác bằng Zod schema.

### ✅ Phase 2: Sơ đồ tư duy (M3) + Bách khoa tri thức (M6)
- 🧠 **Sơ đồ tư duy (M3)**:
  - Xây dựng trên nền **React Flow (`@xyflow/react`)**.
  - Node đa năng: Tiêu đề, màu sắc, công thức toán học KaTeX, ghi chú mở rộng, checklist công việc.
  - Phím tắt tiện lợi: `Tab` tạo node con, `Enter` tạo node cùng cấp, `Del` xóa node, nhấp đúp để chỉnh sửa.
  - Thu gọn / Mở rộng (`collapse/expand`) các nhánh con.
  - Tự động căn chỉnh bố cục (**Auto-Layout**): Cây ngang, Cây dọc, Tỏa tròn (Radial).
  - Hoàn tác `Undo (Ctrl+Z)` và `Redo (Ctrl+Y)`.
  - Xuất ảnh PNG (độ phân giải cao 2x), vector SVG, file JSON.
  - **Tạo Checklist Note**: Chuyển đổi toàn bộ sơ đồ tư duy thành một trang ghi chú checklist trong module Ghi chú (M2).
- 🌐 **Bách khoa tri thức dạng mạng lưới (M6)**:
  - Đồ thị tri thức kỹ thuật chuẩn xác, hỗ trợ công thức KaTeX, tài liệu tham khảo, nguồn, URL và mức độ khó (1–5).
  - Nhãn kiểm chứng: Cờ `verified` (hiển thị nhãn cảnh báo `[chưa xác minh — đối chiếu datasheet]` nếu chưa được kiểm chứng).
  - 5 loại quan hệ kỹ thuật: `Prerequisite` (Cần học trước), `Related`, `PartOf`, `ExampleOf`, `AppliedTo`.
  - **Đường đi kiến thức (Knowledge Path BFS)**: Tìm lộ trình học tiên quyết ngắn nhất từ điểm A đến điểm B và tô sáng trực tiếp trên đồ thị.
  - **Gợi ý liên kết thông minh**: Phân tích các điểm tri thức có chung thẻ tag để đề xuất tạo quan hệ 1-click (không cần AI).
  - **Cross-module Drawer**: Nhấp vào điểm tri thức để xem chi tiết và liên kết nhanh tới các bài ghi chú liên quan.

### ✅ Phase 3: Hub luyện thi & Phân tích lỗ hổng kiến thức (M4) + Máy tính công thức (M5)
- 🎯 **Hub luyện thi & Phân tích lỗ hổng (M4)**:
  - Tùy chỉnh đề thi: Chọn môn, số câu hỏi, thời lượng (5–30 phút).
  - Chế độ phòng thi tập trung: Đồng hồ đếm ngược, cảnh báo 5 phút, tự động nộp bài khi hết giờ.
  - Bảng câu hỏi (`Question Palette Grid`) trực quan với 3 trạng thái: Đã làm, Chưa làm, Đánh dấu phân vân (`Flag for review`).
  - **Phân tích lỗ hổng kiến thức (Knowledge Gap Analysis)**:
    - Chấm điểm tự động trên thang điểm 10.
    - Biểu đồ thanh **Recharts** trực quan hóa mức độ nắm vững từng chủ đề.
    - Cảnh báo chủ đề yếu (< 60%) kèm **nút đề xuất ôn tập liên kết chéo 1-click** (mở Note M2, Mindmap M3, hoặc Tri thức M6).
  - Xem lại chi tiết từng câu kèm lời giải thích KaTeX.
  - Ngân hàng câu hỏi trắc nghiệm & điền số, lưu trữ lịch sử các lần thi.
- 🧮 **Máy tính công thức & Giải bài tập từng bước (M5)**:
  - Thư viện công thức phân loại theo: Toán kỹ thuật, Vật lý đại cương, Mạch & Điện tử, Công thức tùy chỉnh.
  - **Interactive Solver**: Nhập các biến đầu vào -> Tính toán chính xác bằng engine toán học **`mathjs`** -> Hiển thị kết quả kèm đơn vị chuẩn.
  - **Lời giải chi tiết từng bước (Step-by-step breakdown)**: Liệt kê từng bước tính toán và công thức áp dụng.
  - **Máy tính khoa học (Scientific Calculator Pad)**: Màn hình nhập biểu thức, phím số, các hàm lượng giác, logarit, căn bậc hai, lũy thừa, hằng số $\pi$, $e$, lưu lịch sử 20 phép tính gần nhất.

### ⏳ Phase 4: Tra cứu linh kiện & chân IC (M7) + Kiểm thử tích hợp toàn diện (Sắp ra mắt)

---

## 🛠️ Công nghệ cốt lõi

- **Framework**: React 18 + TypeScript (strict mode) + Vite
- **Styling**: Tailwind CSS + Typography + Lucide Icons
- **State & Storage**: Zustand + Dexie.js (IndexedDB v3)
- **Editor**: TipTap (StarterKit, TaskList, Table, Image, Math) + DOMPurify
- **Graph & Mindmap**: @xyflow/react (React Flow)
- **Toán học & Khoa học**: KaTeX + mathjs
- **Biểu đồ**: Recharts
- **Xác thực dữ liệu**: Zod

---

## 💻 Hướng dẫn chạy cục bộ (Local Development)

```bash
# Yêu cầu cài đặt Node.js 18+ (https://nodejs.org)
git clone https://github.com/Hnam20076/Project-Study.git
cd Project-Study

# Cài đặt thư viện
npm install

# Khởi chạy môi trường phát triển
npm run dev
```

Mở trình duyệt tại địa chỉ: `http://localhost:5173/Project-Study/`
