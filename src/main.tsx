import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import 'katex/dist/katex.min.css'
import './index.css'
import { seedDemoDataIfNeeded } from './db/seed'
import { ensureDBReady } from './db/database'
import { migrateAllNotesBase64Images } from './services/noteMigration'

// Khởi động ứng dụng
async function main() {
  // Đảm bảo IndexedDB đã sẵn sàng và hoàn tất migration schema
  await ensureDBReady()

  // Nạp dữ liệu mẫu nếu cần
  await seedDemoDataIfNeeded()

  // Tự động di chuyển ảnh base64 cũ trong note sang Blob IndexedDB
  try {
    await migrateAllNotesBase64Images()
  } catch (err) {
    console.error('Base64 image migration error:', err)
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter basename="/Project-Study">
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
}

main().catch(console.error)
