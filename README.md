# Personal Study OS

Hệ điều hành học tập cá nhân cho sinh viên kỹ thuật Việt Nam.

🌐 **Demo trực tiếp**: https://hnam20076.github.io/Project-Study/

## Tính năng Phase 1

- 📅 **Thời khóa biểu** — Xem Ngày/Tuần/Tháng, thêm/sửa/xóa tiết học, cảnh báo trùng lịch
- 📝 **Ghi chú** — Cây Notebook/Section/Page, editor TipTap đầy đủ, autosave, phiên bản
- 🔍 **Command Palette** — Ctrl+K tìm xuyên module
- 🌓 **Dark/Light/System** — Dark mode thật sự
- 💾 **Offline** — Dữ liệu lưu IndexedDB, PWA
- 📤 **Export/Import** — Xuất nhập JSON, validate bằng Zod

## Stack

Vite + React 18 + TypeScript + Tailwind CSS + Dexie (IndexedDB) + TipTap + Zustand + Zod

## Chạy local

```bash
# Cài Node.js 18+ từ https://nodejs.org
npm install
npm run dev
```

Mở http://localhost:5173/Project-Study/

## Build

```bash
npm run build
```

Output ở thư mục `dist/`.

## Cấu trúc thư mục

```
src/
├── app/          # App entry
├── components/   # Shared components (Layout, ErrorBoundary, CommandPalette)
├── features/     # Các module
│   ├── dashboard/
│   ├── schedule/ (M1)
│   └── notes/    (M2)
├── stores/       # Zustand stores
├── db/           # Dexie database, repositories, export/import
├── lib/          # Utilities
├── types/        # TypeScript types
└── i18n/         # Chuỗi tiếng Việt
```
