import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import { useTasksStore } from '../../store/tasksStore'
import { useTeamsStore } from '../../store/teamsStore'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const { fetchTasks, subscribeToTasks, unsubscribe } = useTasksStore()
  const { fetchTeams, fetchMembers } = useTeamsStore()
  const location = useLocation()

  useEffect(() => {
    fetchTasks()
    fetchTeams()
    fetchMembers()
    subscribeToTasks()
    return () => unsubscribe()
  }, [])

  const sidebarWidth = collapsed ? 60 : 220

  return (
    <div className="min-h-screen bg-bg-900">
      <div className="bg-grid-pattern fixed inset-0 opacity-30 pointer-events-none" />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.25s ease' }}>
        <Header />
        <main className="p-6 min-h-[calc(100vh-56px)]">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  )
}
