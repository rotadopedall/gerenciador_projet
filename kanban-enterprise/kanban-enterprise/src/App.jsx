import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/shared/Layout'
import AuthGuard from './components/auth/AuthGuard'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardPage from './pages/DashboardPage'
import KanbanPage from './pages/KanbanPage'
import TasksPage from './pages/TasksPage'
import TeamsPage from './pages/TeamsPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import LoadingScreen from './components/shared/LoadingScreen'

export default function App() {
  const { initialize, loading, session } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={!session ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
        <Route index element={<DashboardPage />} />
        <Route path="kanban" element={<KanbanPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
