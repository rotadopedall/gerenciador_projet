import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import TaskCard from './TaskCard'

export default function KanbanColumn({ column, tasks, onTaskClick, onAddTask, canCreate }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <motion.div
      className="flex-shrink-0 flex flex-col"
      style={{ width: '260px' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2 mb-2 rounded-xl"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderLeft: `3px solid ${column.color}`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{column.icon}</span>
          <span className="text-xs font-semibold text-slate-300" style={{ fontFamily: 'Syne' }}>
            {column.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded"
            style={{ color: column.color, background: `${column.color}20` }}
          >
            {tasks.length}
          </span>
          {canCreate && (
            <button
              onClick={() => onAddTask?.(column.id)}
              className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/10 transition-all cursor-pointer"
            >
              <Plus size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Drop area */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-2 min-h-[120px] rounded-xl p-2 transition-all duration-200"
        style={{
          background: isOver ? `${column.color}08` : 'transparent',
          border: isOver ? `1px dashed ${column.color}40` : '1px dashed transparent',
          minHeight: '120px',
        }}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              onClick={onTaskClick}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[10px] text-slate-600 text-center">Sem tarefas</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
