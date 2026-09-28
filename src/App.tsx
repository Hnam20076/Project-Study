import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { CommandPalette } from '@/components/CommandPalette'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { SchedulePage } from '@/features/schedule/SchedulePage'
import { NotesPage } from '@/features/notes/NotesPage'
import { useThemeStore } from '@/stores/uiStore'

export default function App() {
  const { resolvedTheme } = useThemeStore()

  return (
    <>
      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        theme={resolvedTheme}
        richColors
        closeButton
      />

      {/* Command Palette */}
      <CommandPalette />

      {/* Routes */}
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="schedule/*" element={<SchedulePage />} />
          <Route path="notes/*" element={<NotesPage />} />
          {/* Phase 2+ routes - chưa enable */}
        </Route>
      </Routes>
    </>
  )
}
