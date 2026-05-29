import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useTasksStore = create((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  filters: {
    team: '',
    assignee: '',
    status: '',
    priority: '',
    criticality: '',
    sla: '',
    search: '',
    dateFrom: '',
    dateTo: '',
  },
  subscription: null,

  setFilter: (key, value) => set(s => ({
    filters: { ...s.filters, [key]: value }
  })),

  resetFilters: () => set({
    filters: { team: '', assignee: '', status: '', priority: '', criticality: '', sla: '', search: '', dateFrom: '', dateTo: '' }
  }),

  fetchTasks: async () => {
    set({ loading: true, error: null })
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, full_name, email, avatar_url),
        team:teams(id, name, color),
        creator:profiles!tasks_created_by_fkey(id, full_name)
      `)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }
    set({ tasks: data || [], loading: false })
  },

  subscribeToTasks: () => {
    const existing = get().subscription
    if (existing) existing.unsubscribe()

    const sub = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' },
        async () => {
          await get().fetchTasks()
        }
      )
      .subscribe()

    set({ subscription: sub })
  },

  unsubscribe: () => {
    const sub = get().subscription
    if (sub) {
      sub.unsubscribe()
      set({ subscription: null })
    }
  },

  createTask: async (taskData) => {
    const { data: { user } } = await supabase.auth.getUser()
    const slaDeadline = taskData.sla_hours
      ? new Date(Date.now() + taskData.sla_hours * 3600000).toISOString()
      : null

    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        ...taskData,
        created_by: user.id,
        sla_deadline: slaDeadline,
        status: taskData.status || 'backlog',
      }])
      .select()
      .single()

    if (error) throw error

    // Log history
    await supabase.from('task_history').insert([{
      task_id: data.id,
      user_id: user.id,
      action: 'Tarefa criada',
      new_value: { status: data.status },
    }])

    return data
  },

  updateTask: async (id, updates) => {
    const { data: { user } } = await supabase.auth.getUser()
    const current = get().tasks.find(t => t.id === id)

    if (updates.sla_hours && updates.sla_hours !== current?.sla_hours) {
      updates.sla_deadline = new Date(Date.now() + updates.sla_hours * 3600000).toISOString()
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log significant changes
    if (updates.status && updates.status !== current?.status) {
      await supabase.from('task_history').insert([{
        task_id: id,
        user_id: user.id,
        action: `Status alterado`,
        old_value: { status: current?.status },
        new_value: { status: updates.status },
      }])
    }
    if (updates.assignee_id && updates.assignee_id !== current?.assignee_id) {
      await supabase.from('task_history').insert([{
        task_id: id,
        user_id: user.id,
        action: 'Responsável atribuído',
        new_value: { assignee_id: updates.assignee_id },
      }])
    }

    return data
  },

  moveTask: async (id, newStatus) => {
    return get().updateTask(id, { status: newStatus })
  },

  deleteTask: async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
  },

  getFilteredTasks: () => {
    const { tasks, filters } = get()
    return tasks.filter(task => {
      if (filters.team && task.team_id !== filters.team) return false
      if (filters.assignee && task.assignee_id !== filters.assignee) return false
      if (filters.status && task.status !== filters.status) return false
      if (filters.priority && task.priority !== filters.priority) return false
      if (filters.criticality && task.criticality !== filters.criticality) return false
      if (filters.sla === 'expired') {
        if (!task.sla_deadline || new Date(task.sla_deadline) > new Date()) return false
      }
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!task.title.toLowerCase().includes(q) &&
            !task.description?.toLowerCase().includes(q) &&
            !task.seq_id?.toString().includes(q)) return false
      }
      return true
    })
  },

  getTasksByStatus: (status) => {
    const filtered = get().getFilteredTasks()
    return filtered.filter(t => t.status === status)
  },

  getDashboardStats: () => {
    const { tasks } = get()
    const now = new Date()
    return {
      total: tasks.length,
      inProgress: tasks.filter(t => t.status === 'em_andamento').length,
      completed: tasks.filter(t => t.status === 'concluido').length,
      slaExpired: tasks.filter(t => t.sla_deadline && new Date(t.sla_deadline) < now && t.status !== 'concluido' && t.status !== 'cancelado').length,
      critical: tasks.filter(t => t.criticality === 'critica' && t.status !== 'concluido' && t.status !== 'cancelado').length,
      open: tasks.filter(t => !['concluido', 'cancelado'].includes(t.status)).length,
    }
  },
}))
