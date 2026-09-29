import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { seedDemoDataIfNeeded } from './db/seed'
import { ensureDBReady } from './db/database'

// Khởi động ứng dụng
async function main() {
  // Đảm bảo IndexedDB đã sẵn sàng và hoàn tất migration schema
  await ensureDBReady()

  // Nạp dữ liệu mẫu nếu cần
  await seedDemoDataIfNeeded()

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter basename="/Project-Study">
        <App />
      </BrowserRouter>
    </React.StrictMode>,
  )
}

main().catch(console.error)
