import { motion } from 'framer-motion'
import { ListTodo, Activity, CheckSquare, AlertCircle, Flame, Users, TrendingUp, Clock } from 'lucide-react'
import { useTasksStore } from '../store/tasksStore'
import { useTeamsStore } from '../store/teamsStore'
import { useAuthStore } from '../store/authStore'
import { COLUMNS, CRITICALITIES, getSLAStatus, formatSLATime } from '../lib/constants'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function StatCard({ icon: Icon, label, value, color, sublabel, delay = 0 }) {
  return (
    <motion.div
      className="card glass-hover relative overflow-hidden"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-mono">{label}</div>
          <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne', color }}>
            {value}
          </div>
          {sublabel && <div className="text-[10px] text-slate-500 mt-1">{sublabel}</div>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-40" style={{ background: color }} />
    </motion.div>
  )
}

export default function DashboardPage() {
  const { tasks } = useTasksStore()
  const { teams, members } = useTeamsStore()
  const { profile } = useAuthStore()

  const stats = useTasksStore(s => s.getDashboardStats())

  // Recent tasks
  const recent = [...tasks].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 8)

  // SLA expiring soon
  const expiringSoon = tasks.filter(t => {
    if (!t.sla_deadline || ['concluido', 'cancelado'].includes(t.status)) return false
    const sla = getSLAStatus(t)
    return sla && (sla.expired || sla.percentRemaining < 20)
  }).slice(0, 5)

  // Status distribution
  const statusDist = COLUMNS.map(col => ({
    ...col,
    count: tasks.filter(t => t.status === col.id).length,
  })).filter(c => c.count > 0)

  const maxCount = Math.max(...statusDist.map(s => s.count), 1)

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Syne' }}>
            Olá, {profile?.full_name?.split(' ')[0]} 👋
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={ListTodo} label="Total" value={stats.total} color="#3b82f6" delay={0.05} />
        <StatCard icon={Activity} label="Em Andamento" value={stats.inProgress} color="#10b981" delay={0.1} />
        <StatCard icon={CheckSquare} label="Concluídas" value={stats.completed} color="#22c55e" delay={0.15} />
        <StatCard icon={AlertCircle} label="SLA Vencido" value={stats.slaExpired} color="#ef4444" delay={0.2} sublabel="Requer atenção" />
        <StatCard icon={Flame} label="Críticas" value={stats.critical} color="#f97316" delay={0.25} />
        <StatCard icon={Users} label="Equipes" value={teams.length} color="#8b5cf6" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status distribution */}
        <motion.div
          className="card lg:col-span-2"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="section-title flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-400" />
            Distribuição por Status
          </div>
          <div className="space-y-2">
            {statusDist.map(col => (
              <div key={col.id} className="flex items-center gap-3">
                <div className="w-24 text-[10px] text-slate-400 text-right flex-shrink-0 truncate">{col.label}</div>
                <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <motion.div
                    className="h-full rounded flex items-center px-2"
                    style={{ background: `${col.color}25`, border: `1px solid ${col.color}30` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(col.count / maxCount) * 100}%` }}
                    transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
                  >
                    <span className="text-[10px] font-mono" style={{ color: col.color }}>{col.count}</span>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* SLA Alerts */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="section-title flex items-center gap-2">
            <Clock size={14} className="text-red-400" />
            Alertas SLA
          </div>
          {expiringSoon.length === 0 ? (
            <div className="text-center py-6 text-slate-600 text-xs">✅ Todos os SLAs em dia</div>
          ) : (
            <div className="space-y-2">
              {expiringSoon.map(task => {
                const sla = getSLAStatus(task)
                return (
                  <div key={task.id} className="p-2 rounded-lg" style={{ background: `${sla?.color}10`, border: `1px solid ${sla?.color}25` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs text-slate-300 truncate">{task.title}</div>
                        <div className="text-[10px] text-slate-500">#{task.seq_id}</div>
                      </div>
                      <div className={`text-[10px] font-mono flex-shrink-0 ${sla?.expired ? 'sla-warning-blink' : ''}`} style={{ color: sla?.color }}>
                        {sla?.expired ? `−${formatSLATime(sla.remaining)}` : formatSLATime(sla?.remaining)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent activity */}
      <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
        <div className="section-title">Atividade Recente</div>
        <div className="space-y-1">
          {recent.length === 0 && <div className="text-center py-6 text-slate-600 text-xs">Nenhuma tarefa encontrada</div>}
          {recent.map(task => {
            const criticality = CRITICALITIES.find(c => c.id === task.criticality)
            const col = COLUMNS.find(c => c.id === task.status)
            return (
              <div key={task.id} className="flex items-center gap-3 px-3 py-2 rounded-lg glass-hover">
                <span className="text-xs font-mono text-slate-600 w-10 flex-shrink-0">#{task.seq_id}</span>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: criticality?.color || '#64748b' }} />
                <span className="text-xs text-slate-300 flex-1 truncate">{task.title}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: col?.color, background: `${col?.color}15` }}>
                    {col?.label}
                  </span>
                  <span className="text-[10px] text-slate-600 font-mono hidden md:block">
                    {format(new Date(task.updated_at), 'dd/MM HH:mm', { locale: ptBR })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
