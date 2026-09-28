import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileBottomNav } from './MobileBottomNav'
import { useUIStore } from '@/stores/uiStore'
import { useEffect } from 'react'

export function AppLayout() {
  const { sidebarCollapsed } = useUIStore()

  // Đăng ký phím tắt toàn cục
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K = Command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        useUIStore.getState().openCommandPalette()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-dark-bg">
      {/* Sidebar - hiện trên desktop */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          transition: 'margin-left 0.2s ease',
        }}
      >
        {/* Header padding để không bị che */}
        <div className="min-h-screen pb-20 md:pb-0">
          <Outlet />
        </div>
      </main>

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
