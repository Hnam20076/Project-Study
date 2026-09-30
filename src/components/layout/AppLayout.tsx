import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { QuickCaptureModal } from '../QuickCaptureModal'
import { useUIStore } from '@/stores/uiStore'
import { startReminderScheduler } from '@/services/reminderService'
import { vi } from '@/i18n/vi'
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'

export function AppLayout() {
  const { sidebarCollapsed } = useUIStore()
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false)

  // Đăng ký phím tắt toàn cục & scheduler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K = Command palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        useUIStore.getState().openCommandPalette()
      }
      // Alt+N = Quick Capture
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setQuickCaptureOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Khởi động trình nhắc nhở định kỳ
    const stopReminders = startReminderScheduler(60000)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      stopReminders()
    }
  }, [])

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-dark-bg">
      {/* Sidebar - hiện trên desktop */}
      <div className="hidden md:flex flex-shrink-0 h-full relative">
        <Sidebar />
      </div>

      {/* Main content */}
      <main
        className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden relative"
        style={{
          transition: 'margin-left 0.2s ease',
        }}
      >
        <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </div>
      </main>

      {/* Floating Action Button (Quick Capture) */}
      <button
        type="button"
        onClick={() => setQuickCaptureOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 z-30 w-12 h-12 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white shadow-xl shadow-primary-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        aria-label={vi.quickCapture.buttonAria}
        title="Tạo nhanh (Alt+N)"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Quick Capture Modal */}
      <QuickCaptureModal
        isOpen={quickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
      />

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40">
        <MobileBottomNav />
      </div>

      {/* Sidebar collapsed state indicator */}
      <div
        className={`hidden md:block fixed left-0 top-0 h-full bg-slate-200/20 dark:bg-dark-border/20 pointer-events-none transition-all duration-200`}
        style={{ width: sidebarCollapsed ? '56px' : '240px' }}
      />
    </div>
  )
}

