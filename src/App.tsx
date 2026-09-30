import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { CommandPalette } from '@/components/CommandPalette'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { SchedulePage } from '@/features/schedule/SchedulePage'
import { NotesPage } from '@/features/notes/NotesPage'
import { MindMapPage } from '@/features/mindmap/MindMapPage'
import { KnowledgePage } from '@/features/knowledge/KnowledgePage'
import { QuizPage } from '@/features/quiz/QuizPage'
import { CalculatorPage } from '@/features/calculator/CalculatorPage'
import { ComponentsPage } from '@/features/components'
import { TasksPage } from '@/features/tasks'
import { PlannerPage } from '@/features/planner'
import { FocusPage } from '@/features/focus'
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
          <Route path="planner/*" element={<PlannerPage />} />
          <Route path="tasks/*" element={<TasksPage />} />
          <Route path="focus/*" element={<FocusPage />} />
          <Route path="notes/*" element={<NotesPage />} />
          <Route path="mindmap/*" element={<MindMapPage />} />
          <Route path="quiz/*" element={<QuizPage />} />
          <Route path="calculator/*" element={<CalculatorPage />} />
          <Route path="knowledge/*" element={<KnowledgePage />} />
          <Route path="components/*" element={<ComponentsPage />} />
        </Route>
      </Routes>
    </>
  )
}
