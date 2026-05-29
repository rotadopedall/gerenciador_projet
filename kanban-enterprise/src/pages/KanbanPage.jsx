import { useState, useCallback } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, pointerWithin
} from '@dnd-kit/core'
import { AnimatePresence } from 'framer-motion'
import { Filter, RefreshCw } from 'lucide-react'
import KanbanColumn from '../components/kanban/KanbanColumn'
import TaskCard from '../components/kanban/TaskCard'
import TaskModal from '../components/tasks/TaskModal'
import { useTasksStore } from '../store/tasksStore'
import { useTeamsStore } from '../store/teamsStore'
import { useAuthStore } from '../store/authStore'
import { COLUMNS } from '../lib/constants'
import toast from 'react-hot-toast'

export default function KanbanPage() {
  const [activeTask, setActiveTask] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showNewTaskModal, setShowNewTaskModal] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState('backlog')
  const [showFilters, setShowFilters] = useState(false)

  const { getTasksByStatus, moveTask, fetchTasks, filters, setFilter, resetFilters } = useTasksStore()
  const { teams, members } = useTeamsStore()
  const { can } = useAuthStore()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = useCallback(({ active }) => {
    const allTasks = COLUMNS.flatMap(col => getTasksByStatus(col.id))
    setActiveTask(allTasks.find(t => t.id === active.id))
  }, [getTasksByStatus])

  const handleDragEnd = useCallback(async ({ active, over }) => {
    setActiveTask(null)
    if (!over) return

    // over.id is either a column id or a task id
    let targetStatus = COLUMNS.find(c => c.id === over.id)?.id
    if (!targetStatus) {
      // dropped on a task — find its column
      const allTasks = COLUMNS.flatMap(col => getTasksByStatus(col.id).map(t => ({ ...t, _col: col.id })))
      const overTask = allTasks.find(t => t.id === over.id)
      targetStatus = overTask?._col
    }

    if (!targetStatus) return

    const sourceTask = COLUMNS.flatMap(col => getTasksByStatus(col.id)).find(t => t.id === active.id)
    if (!sourceTask || sourceTask.status === targetStatus) return

    try {
      await moveTask(active.id, targetStatus)
    } catch {
      toast.error('Erro ao mover tarefa')
    }
  }, [getTasksByStatus, moveTask])

  const handleAddTask = (status) => {
    setDefaultStatus(status)
    setShowNewTaskModal(true)
  }

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== '').length - (filters.search ? 1 : 0)

  return (
    <div className="flex flex-col h-[calc(100vh-88px)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`btn-ghost text-xs ${activeFiltersCount > 0 ? 'glass-accent' : ''}`}
          >
            <Filter size={13} />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button onClick={resetFilters} className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
              Limpar
            </button>
          )}
        </div>
        <button onClick={fetchTasks} className="btn-ghost text-xs">
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      {/* Filter bar */}
      <AnimatePresence>
        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl glass flex-shrink-0">
            <select value={filters.team} onChange={e => setFilter('team', e.target.value)} className="input-field w-40 h-8 text-xs">
              <option value="">Todas equipes</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select value={filters.assignee} onChange={e => setFilter('assignee', e.target.value)} className="input-field w-40 h-8 text-xs">
              <option value="">Todos responsáveis</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
            <select value={filters.priority} onChange={e => setFilter('priority', e.target.value)} className="input-field w-32 h-8 text-xs">
              <option value="">Prioridade</option>
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
            <select value={filters.criticality} onChange={e => setFilter('criticality', e.target.value)} className="input-field w-32 h-8 text-xs">
              <option value="">Criticidade</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
            <select value={filters.sla} onChange={e => setFilter('sla', e.target.value)} className="input-field w-32 h-8 text-xs">
              <option value="">SLA</option>
              <option value="expired">Vencidos</option>
            </select>
          </div>
        )}
      </AnimatePresence>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 h-full pb-4" style={{ width: 'max-content' }}>
            {COLUMNS.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={getTasksByStatus(column.id)}
                onTaskClick={setSelectedTask}
                onAddTask={can('canCreateTasks') ? handleAddTask : undefined}
                canCreate={can('canCreateTasks')}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task detail modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
        )}
        {showNewTaskModal && (
          <TaskModal defaultStatus={defaultStatus} onClose={() => setShowNewTaskModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
