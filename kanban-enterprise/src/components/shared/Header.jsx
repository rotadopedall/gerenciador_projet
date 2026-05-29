import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, Plus, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTasksStore } from '../../store/tasksStore'
import { useAuthStore } from '../../store/authStore'
import TaskModal from '../tasks/TaskModal'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/kanban': 'Kanban Board',
  '/tasks': 'Tarefas',
  '/teams': 'Equipes',
  '/users': 'Usuários',
  '/settings': 'Configurações',
}

export default function Header() {
  const location = useLocation()
  const { filters, setFilter } = useTasksStore()
  const { can } = useAuthStore()
  const [showTaskModal, setShowTaskModal] = useState(false)

  const title = PAGE_TITLES[location.pathname] || 'OpsKanban'

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center gap-4 px-6 h-14"
        style={{
          background: 'rgba(8,12,20,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
        <div className="flex-1 flex items-center gap-4">
          <h1 className="text-sm font-semibold text-slate-300 mr-4" style={{ fontFamily: 'Syne' }}>
            {title}
          </h1>

          {/* Global search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              className="input-field pl-8 h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications placeholder */}
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all cursor-pointer relative">
            <Bell size={15} />
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
          </button>

          {/* Create task button */}
          {can('canCreateTasks') && (
            <button
              onClick={() => setShowTaskModal(true)}
              className="btn-primary h-8 text-xs"
            >
              <Plus size={14} />
              Nova Tarefa
            </button>
          )}
        </div>
      </header>

      <AnimatePresence>
        {showTaskModal && (
          <TaskModal onClose={() => setShowTaskModal(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
