import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { MessageSquare, Clock, User, Tag, AlertCircle } from 'lucide-react'
import { PRIORITIES, CRITICALITIES, getSLAStatus, formatSLATime } from '../../lib/constants'
import SLATimer from '../shared/SLATimer'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function TaskCard({ task, onClick, index }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  }

  const priority = PRIORITIES.find(p => p.id === task.priority)
  const criticality = CRITICALITIES.find(c => c.id === task.criticality)
  const sla = getSLAStatus(task)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <motion.div
        className="group relative rounded-xl p-3 cursor-pointer"
        style={{
          background: criticality ? `${criticality.bg}` : 'rgba(255,255,255,0.03)',
          border: `1px solid ${criticality ? criticality.border : 'rgba(255,255,255,0.06)'}`,
          boxShadow: isDragging ? '0 20px 60px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.2)',
        }}
        whileHover={{ y: -1, boxShadow: '0 6px 20px rgba(0,0,0,0.35)' }}
        onClick={(e) => {
          if (!isDragging) onClick?.(task)
        }}
      >
        {/* Top row: ID + priority + criticality */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="text-[10px] font-mono text-slate-500">#{task.seq_id}</span>
          <div className="flex items-center gap-1 ml-auto">
            {priority && (
              <span
                className="badge text-[9px]"
                style={{ color: priority.color, background: priority.bg }}
              >
                {priority.label}
              </span>
            )}
            {criticality && task.criticality !== 'baixa' && (
              <span
                className="badge text-[9px]"
                style={{ color: criticality.color, background: criticality.bg }}
              >
                {criticality.label}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <p className="text-xs font-medium text-slate-200 leading-relaxed mb-2 line-clamp-2">
          {task.title}
        </p>

        {/* Category */}
        {task.category && (
          <div className="flex items-center gap-1 mb-2">
            <Tag size={9} className="text-slate-500" />
            <span className="text-[10px] text-slate-500">{task.category}</span>
          </div>
        )}

        {/* SLA */}
        {task.sla_deadline && <div className="mb-2"><SLATimer task={task} compact /></div>}

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          {/* Assignee */}
          <div className="flex items-center gap-1.5">
            {task.assignee ? (
              <>
                <div className="w-5 h-5 rounded-md bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-[9px] font-bold text-blue-300">
                  {task.assignee.full_name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-[10px] text-slate-400">{task.assignee.full_name?.split(' ')[0]}</span>
              </>
            ) : (
              <div className="flex items-center gap-1 text-slate-600">
                <User size={10} />
                <span className="text-[10px]">N/A</span>
              </div>
            )}
          </div>

          {/* Team color + due date */}
          <div className="flex items-center gap-2">
            {task.team && (
              <div
                className="w-2 h-2 rounded-full"
                title={task.team.name}
                style={{ background: task.team.color || '#64748b' }}
              />
            )}
            {task.due_date && (
              <span className="text-[10px] text-slate-500 font-mono">
                {format(new Date(task.due_date), 'dd/MM', { locale: ptBR })}
              </span>
            )}
          </div>
        </div>

        {/* Criticidade indicator line */}
        {criticality && (
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl"
            style={{ background: criticality.color, opacity: 0.5 }}
          />
        )}
      </motion.div>
    </div>
  )
}
