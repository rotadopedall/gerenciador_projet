import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Filter, ChevronUp, ChevronDown } from 'lucide-react'
import { useTasksStore } from '../store/tasksStore'
import { useTeamsStore } from '../store/teamsStore'
import { useAuthStore } from '../store/authStore'
import { COLUMNS, PRIORITIES, CRITICALITIES, getSLAStatus, formatSLATime } from '../lib/constants'
import TaskModal from '../components/tasks/TaskModal'
import SLATimer from '../components/shared/SLATimer'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function TasksPage() {
  const [selectedTask, setSelectedTask] = useState(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [sort, setSort] = useState({ field: 'created_at', dir: 'desc' })
  const [showFilters, setShowFilters] = useState(false)

  const { getFilteredTasks, filters, setFilter, resetFilters } = useTasksStore()
  const { teams, members } = useTeamsStore()
  const { can } = useAuthStore()

  const tasks = getFilteredTasks()

  const sorted = [...tasks].sort((a, b) => {
    const av = a[sort.field], bv = b[sort.field]
    if (!av) return 1; if (!bv) return -1
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sort.dir === 'asc' ? cmp : -cmp
  })

  const toggleSort = (field) => {
    setSort(s => s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' })
  }

  const SortIcon = ({ field }) => sort.field === field
    ? (sort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
    : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(f => !f)} className="btn-ghost text-xs">
            <Filter size={13} /> Filtros
          </button>
          {Object.values(filters).some(v => v) && (
            <button onClick={resetFilters} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">Limpar</button>
          )}
          <span className="text-xs text-slate-500">{tasks.length} tarefas</span>
        </div>
        {can('canCreateTasks') && (
          <button onClick={() => setShowNewModal(true)} className="btn-primary text-xs">
            <Plus size={14} /> Nova Tarefa
          </button>
        )}
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="flex flex-wrap gap-2 p-3 rounded-xl glass"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className="input-field w-40 h-8 text-xs">
              <option value="">Todos status</option>
              {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { label: 'ID', field: 'seq_id', w: '60px' },
                  { label: 'Título', field: 'title', w: 'auto' },
                  { label: 'Status', field: 'status', w: '120px' },
                  { label: 'Prioridade', field: 'priority', w: '90px' },
                  { label: 'Criticidade', field: 'criticality', w: '90px' },
                  { label: 'Responsável', field: 'assignee_id', w: '120px' },
                  { label: 'Equipe', field: 'team_id', w: '100px' },
                  { label: 'SLA', field: 'sla_deadline', w: '100px' },
                  { label: 'Prazo', field: 'due_date', w: '80px' },
                ].map(col => (
                  <th
                    key={col.field}
                    style={{ width: col.w }}
                    className="px-3 py-2.5 text-left text-[10px] text-slate-500 uppercase tracking-wider font-mono cursor-pointer hover:text-slate-300 transition-colors"
                    onClick={() => toggleSort(col.field)}
                  >
                    <span className="flex items-center gap-1">{col.label}<SortIcon field={col.field} /></span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-600">Nenhuma tarefa encontrada</td>
                </tr>
              )}
              {sorted.map((task, i) => {
                const col = COLUMNS.find(c => c.id === task.status)
                const prio = PRIORITIES.find(p => p.id === task.priority)
                const crit = CRITICALITIES.find(c => c.id === task.criticality)
                const sla = getSLAStatus(task)
                return (
                  <motion.tr
                    key={task.id}
                    className="border-b border-white/4 hover:bg-white/3 cursor-pointer transition-colors"
                    onClick={() => setSelectedTask(task)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <td className="px-3 py-2.5 font-mono text-slate-500">#{task.seq_id}</td>
                    <td className="px-3 py-2.5 text-slate-200 max-w-xs">
                      <span className="truncate block">{task.title}</span>
                      {task.category && <span className="text-[10px] text-slate-600">{task.category}</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="badge" style={{ color: col?.color, background: `${col?.color}15` }}>
                        {col?.label || task.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="badge" style={{ color: prio?.color, background: prio?.bg }}>
                        {prio?.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="badge" style={{ color: crit?.color, background: crit?.bg }}>
                        {crit?.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">
                      {task.assignee?.full_name || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {task.team ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: task.team.color }} />
                          <span className="text-slate-400">{task.team.name}</span>
                        </div>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {sla ? (
                        <span
                          className={`font-mono text-[10px] ${sla.expired ? 'sla-warning-blink' : ''}`}
                          style={{ color: sla.color }}
                        >
                          {sla.expired ? `−${formatSLATime(sla.remaining)}` : formatSLATime(sla.remaining)}
                        </span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-500">
                      {task.due_date ? format(new Date(task.due_date), 'dd/MM/yy', { locale: ptBR }) : '—'}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedTask && <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
        {showNewModal && <TaskModal onClose={() => setShowNewModal(false)} />}
      </AnimatePresence>
    </div>
  )
}
