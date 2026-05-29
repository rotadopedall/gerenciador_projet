export const COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: '#64748b', icon: '📋' },
  { id: 'aberto', label: 'Aberto', color: '#3b82f6', icon: '🔵' },
  { id: 'triagem', label: 'Triagem', color: '#8b5cf6', icon: '🔍' },
  { id: 'atribuido', label: 'Atribuído', color: '#f59e0b', icon: '👤' },
  { id: 'em_andamento', label: 'Em Andamento', color: '#10b981', icon: '⚡' },
  { id: 'aguardando_cliente', label: 'Aguard. Cliente', color: '#f97316', icon: '⏳' },
  { id: 'aguardando_terceiros', label: 'Aguard. Terceiros', color: '#ec4899', icon: '🔗' },
  { id: 'validacao', label: 'Validação', color: '#06b6d4', icon: '✅' },
  { id: 'concluido', label: 'Concluído', color: '#22c55e', icon: '✔️' },
  { id: 'cancelado', label: 'Cancelado', color: '#ef4444', icon: '❌' },
]

export const PRIORITIES = [
  { id: 'baixa', label: 'Baixa', color: '#64748b', bg: 'rgba(100,116,139,0.15)' },
  { id: 'normal', label: 'Normal', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  { id: 'alta', label: 'Alta', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { id: 'critica', label: 'Crítica', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
]

export const CRITICALITIES = [
  { id: 'baixa', label: 'Baixa', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
  { id: 'media', label: 'Média', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  { id: 'alta', label: 'Alta', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
  { id: 'critica', label: 'Crítica', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)' },
]

export const ROLES = [
  { id: 'administrador', label: 'Administrador', color: '#8b5cf6' },
  { id: 'gestor', label: 'Gestor', color: '#3b82f6' },
  { id: 'supervisor', label: 'Supervisor', color: '#06b6d4' },
  { id: 'tecnico', label: 'Técnico', color: '#10b981' },
  { id: 'visualizador', label: 'Visualizador', color: '#64748b' },
]

export const SLA_COLORS = {
  safe: { color: '#22c55e', label: 'No Prazo', bg: 'rgba(34,197,94,0.1)' },
  warning: { color: '#f59e0b', label: 'Atenção', bg: 'rgba(245,158,11,0.1)' },
  critical: { color: '#f97316', label: 'Crítico', bg: 'rgba(249,115,22,0.1)' },
  expired: { color: '#ef4444', label: 'Vencido', bg: 'rgba(239,68,68,0.1)' },
}

export function getSLAStatus(task) {
  if (!task.sla_deadline) return null
  const now = new Date()
  const deadline = new Date(task.sla_deadline)
  const created = new Date(task.created_at)
  const total = deadline - created
  const remaining = deadline - now
  const percentRemaining = (remaining / total) * 100

  if (remaining < 0) return { ...SLA_COLORS.expired, percentRemaining: 0, remaining, expired: true }
  if (percentRemaining > 50) return { ...SLA_COLORS.safe, percentRemaining, remaining, expired: false }
  if (percentRemaining > 20) return { ...SLA_COLORS.warning, percentRemaining, remaining, expired: false }
  return { ...SLA_COLORS.critical, percentRemaining, remaining, expired: false }
}

export function formatSLATime(ms) {
  if (!ms) return '--'
  const abs = Math.abs(ms)
  const hours = Math.floor(abs / 3600000)
  const minutes = Math.floor((abs % 3600000) / 60000)
  if (hours > 24) {
    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export const ROLE_PERMISSIONS = {
  administrador: {
    canCreateUsers: true, canEditUsers: true, canDeleteUsers: true,
    canManageTeams: true, canManagePermissions: true,
    canCreateTasks: true, canEditTasks: true, canDeleteTasks: true,
    canMoveTasks: true, canAssignTasks: true, canComment: true,
    canViewAll: true, canConfigureSLA: true, canConfigureQueues: true,
  },
  gestor: {
    canCreateTasks: true, canEditTasks: true, canDeleteTasks: true,
    canMoveTasks: true, canAssignTasks: true, canManageTeams: true,
    canComment: true, canViewAll: true,
  },
  supervisor: {
    canMoveTasks: true, canComment: true, canReassignTasks: true, canViewAll: true,
  },
  tecnico: {
    canMoveTasks: true, canComment: true, canViewOwn: true,
  },
  visualizador: {
    canViewAll: true,
  },
}
