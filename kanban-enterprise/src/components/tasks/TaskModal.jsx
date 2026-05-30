import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, History, Trash2, Edit2, Save } from 'lucide-react'
import Modal from '../shared/Modal'
import SLATimer from '../shared/SLATimer'
import Select from '../shared/Select'
import { useTasksStore } from '../../store/tasksStore'
import { useTeamsStore } from '../../store/teamsStore'
import { useAuthStore } from '../../store/authStore'
import { PRIORITIES, CRITICALITIES, COLUMNS } from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function TaskModal({ task: initialTask = null, onClose, defaultStatus }) {
  const isNew = !initialTask
  const [task, setTask] = useState(initialTask)
  const [mode, setMode] = useState(isNew ? 'edit' : 'view')
  const [comments, setComments] = useState([])
  const [history, setHistory] = useState([])
  const [activeTab, setActiveTab] = useState('details')
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { createTask, updateTask, deleteTask } = useTasksStore()
  const { teams, members } = useTeamsStore()
  const { can, profile } = useAuthStore()

  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: task ? {
      title: task.title, description: task.description,
      category: task.category, status: task.status,
      priority: task.priority, criticality: task.criticality,
      assignee_id: task.assignee_id || '',
      team_id: task.team_id || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      sla_hours: task.sla_hours || 24,
      tags: task.tags?.join(', ') || '',
    } : {
      status: defaultStatus || 'backlog',
      priority: 'normal', criticality: 'media',
      sla_hours: 24, team_id: '', assignee_id: '',
    }
  })

  useEffect(() => {
    if (!isNew && task) loadComments()
  }, [task?.id])

  const loadComments = async () => {
    const [{ data: c }, { data: h }] = await Promise.all([
      supabase.from('task_comments')
        .select('*, author:profiles(id, full_name)')
        .eq('task_id', task.id).order('created_at', { ascending: true }),
      supabase.from('task_history')
        .select('*, user:profiles(id, full_name)')
        .eq('task_id', task.id).order('created_at', { ascending: false }),
    ])
    if (c) setComments(c)
    if (h) setHistory(h)
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const payload = {
        ...data,
        assignee_id: data.assignee_id || null,
        team_id: data.team_id || null,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
        sla_hours: parseInt(data.sla_hours) || 24,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }
      if (isNew) {
        await createTask(payload)
        toast.success('Tarefa criada!')
      } else {
        await updateTask(task.id, payload)
        toast.success('Tarefa atualizada!')
      }
      onClose()
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar tarefa')
    }
    setSubmitting(false)
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    try {
      const { error } = await supabase.from('task_comments').insert([{
        task_id: task.id, author_id: profile.id, content: newComment.trim(),
      }])
      if (error) throw error
      setNewComment('')
      await loadComments()
      toast.success('Comentário adicionado')
    } catch { toast.error('Erro ao adicionar comentário') }
  }

  const handleDelete = async () => {
    if (!confirm('Excluir esta tarefa?')) return
    try {
      await deleteTask(task.id)
      toast.success('Tarefa excluída')
      onClose()
    } catch { toast.error('Erro ao excluir') }
  }

  const canEdit = can('canEditTasks') || (task && task.assignee_id === profile?.id)

  // Build select options
  const statusOptions = COLUMNS.map(c => ({ value: c.id, label: c.label }))
  const priorityOptions = PRIORITIES.map(p => ({ value: p.id, label: p.label, dot: p.color }))
  const criticalityOptions = CRITICALITIES.map(c => ({ value: c.id, label: c.label, dot: c.color }))
  const teamOptions = [{ value: '', label: 'Sem equipe' }, ...teams.map(t => ({ value: t.id, label: t.name, dot: t.color }))]
  const assigneeOptions = [{ value: '', label: 'Não atribuído' }, ...members.map(m => ({ value: m.id, label: m.full_name }))]

  return (
    <Modal
      title={isNew ? 'Nova Tarefa' : `#${task?.seq_id} — ${task?.title}`}
      subtitle={!isNew ? `Criado em ${task?.created_at ? format(new Date(task.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}` : ''}
      onClose={onClose}
      size="xl"
    >
      <div className="p-5">
        {/* Tabs */}
        {!isNew && (
          <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {[
              { id: 'details', label: 'Detalhes' },
              { id: 'comments', label: `Comentários (${comments.length})` },
              { id: 'history', label: 'Histórico' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === tab.id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-500 hover:text-slate-300'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Details tab */}
        {(isNew || activeTab === 'details') && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Título *</label>
              <input {...register('title', { required: true })} disabled={mode === 'view'} className="input-field" placeholder="Descreva brevemente a tarefa..." />
            </div>
            <div>
              <label className="label">Descrição</label>
              <textarea {...register('description')} disabled={mode === 'view'} rows={3} className="input-field resize-none" placeholder="Detalhes, passos, contexto..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Categoria</label>
                <input {...register('category')} disabled={mode === 'view'} className="input-field" placeholder="Ex: Infra, Suporte..." />
              </div>
              <div>
                <label className="label">Status</label>
                <Controller name="status" control={control}
                  render={({ field }) => <Select value={field.value} onChange={field.onChange} options={statusOptions} disabled={mode === 'view'} />} />
              </div>
              <div>
                <label className="label">Prioridade</label>
                <Controller name="priority" control={control}
                  render={({ field }) => <Select value={field.value} onChange={field.onChange} options={priorityOptions} disabled={mode === 'view'} />} />
              </div>
              <div>
                <label className="label">Criticidade</label>
                <Controller name="criticality" control={control}
                  render={({ field }) => <Select value={field.value} onChange={field.onChange} options={criticalityOptions} disabled={mode === 'view'} />} />
              </div>
              <div>
                <label className="label">Equipe</label>
                <Controller name="team_id" control={control}
                  render={({ field }) => <Select value={field.value} onChange={field.onChange} options={teamOptions} placeholder="Sem equipe" disabled={mode === 'view'} />} />
              </div>
              <div>
                <label className="label">Responsável</label>
                <Controller name="assignee_id" control={control}
                  render={({ field }) => <Select value={field.value} onChange={field.onChange} options={assigneeOptions} placeholder="Não atribuído" disabled={mode === 'view'} />} />
              </div>
              <div>
                <label className="label">Prazo</label>
                <input type="date" {...register('due_date')} disabled={mode === 'view'} className="input-field" />
              </div>
              <div>
                <label className="label">SLA (horas)</label>
                <input type="number" {...register('sla_hours')} disabled={mode === 'view'} min={1} className="input-field" />
              </div>
            </div>

            <div>
              <label className="label">Tags (separadas por vírgula)</label>
              <input {...register('tags')} disabled={mode === 'view'} className="input-field" placeholder="ex: urgente, rede, servidor" />
            </div>

            {!isNew && task?.sla_deadline && <SLATimer task={task} />}

            {mode === 'edit' && (
              <div className="flex justify-end gap-2 pt-2">
                {!isNew && <button type="button" onClick={() => setMode('view')} className="btn-ghost">Cancelar</button>}
                <button type="submit" disabled={submitting} className="btn-primary">
                  <Save size={14} />
                  {submitting ? 'Salvando...' : (isNew ? 'Criar Tarefa' : 'Salvar')}
                </button>
              </div>
            )}
            {mode === 'view' && canEdit && (
              <div className="flex justify-between pt-2">
                {can('canDeleteTasks') && (
                  <button type="button" onClick={handleDelete} className="btn-danger"><Trash2 size={14} /> Excluir</button>
                )}
                <button type="button" onClick={() => setMode('edit')} className="btn-primary ml-auto">
                  <Edit2 size={14} /> Editar
                </button>
              </div>
            )}
          </form>
        )}

        {/* Comments tab */}
        {!isNew && activeTab === 'comments' && (
          <div className="space-y-3">
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {comments.length === 0 && <div className="text-center py-8 text-slate-600 text-sm">Sem comentários ainda</div>}
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300 flex-shrink-0">
                    {comment.author?.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-300">{comment.author?.full_name}</span>
                      <span className="text-[10px] text-slate-600 font-mono">
                        {format(new Date(comment.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {can('canComment') && (
              <div className="flex gap-2 pt-2 border-t border-white/6">
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} rows={2}
                  className="input-field resize-none flex-1 text-xs" placeholder="Adicionar comentário... (Ctrl+Enter para enviar)"
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddComment() }} />
                <button onClick={handleAddComment} className="btn-primary self-end"><Send size={13} /></button>
              </div>
            )}
          </div>
        )}

        {/* History tab */}
        {!isNew && activeTab === 'history' && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.length === 0 && <div className="text-center py-8 text-slate-600 text-sm">Sem histórico</div>}
            {history.map(entry => (
              <div key={entry.id} className="flex items-start gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-300">{entry.action}</span>
                    <span className="text-[10px] text-slate-500">{entry.user?.full_name}</span>
                  </div>
                  {entry.old_value?.status && entry.new_value?.status && (
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {entry.old_value.status} → {entry.new_value.status}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-600 font-mono">
                    {format(new Date(entry.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
