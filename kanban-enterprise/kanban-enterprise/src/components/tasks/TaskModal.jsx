import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, History, MessageSquare, Trash2, Edit2, Save, X } from 'lucide-react'
import Modal from '../shared/Modal'
import SLATimer from '../shared/SLATimer'
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
  const [loadingComments, setLoadingComments] = useState(false)

  const { createTask, updateTask, deleteTask } = useTasksStore()
  const { teams, members } = useTeamsStore()
  const { can, profile } = useAuthStore()

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: task ? {
      title: task.title, description: task.description,
      category: task.category, status: task.status,
      priority: task.priority, criticality: task.criticality,
      assignee_id: task.assignee_id, team_id: task.team_id,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      sla_hours: task.sla_hours || 24,
      tags: task.tags?.join(', ') || '',
    } : {
      status: defaultStatus || 'backlog',
      priority: 'normal', criticality: 'media', sla_hours: 24,
    }
  })

  useEffect(() => {
    if (!isNew && task) loadComments()
  }, [task?.id])

  const loadComments = async () => {
    setLoadingComments(true)
    const [{ data: c }, { data: h }] = await Promise.all([
      supabase.from('task_comments')
        .select('*, author:profiles(id, full_name)')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true }),
      supabase.from('task_history')
        .select('*, user:profiles(id, full_name)')
        .eq('task_id', task.id)
        .order('created_at', { ascending: false }),
    ])
    if (c) setComments(c)
    if (h) setHistory(h)
    setLoadingComments(false)
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const payload = {
        ...data,
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
        task_id: task.id,
        author_id: profile.id,
        content: newComment.trim(),
      }])
      if (error) throw error
      setNewComment('')
      await loadComments()
      toast.success('Comentário adicionado')
    } catch (err) {
      toast.error('Erro ao adicionar comentário')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Excluir esta tarefa?')) return
    try {
      await deleteTask(task.id)
      toast.success('Tarefa excluída')
      onClose()
    } catch {
      toast.error('Erro ao excluir')
    }
  }

  const canEdit = can('canEditTasks') || (task && task.assignee_id === profile?.id)

  return (
    <Modal
      title={isNew ? 'Nova Tarefa' : `#${task?.seq_id} — ${task?.title}`}
      subtitle={!isNew ? `Criado em ${task?.created_at ? format(new Date(task.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}` : ''}
      onClose={onClose}
      size="xl"
    >
      <div className="flex h-full">
        {/* Main content */}
        <div className="flex-1 p-5">
          {/* Tabs */}
          {!isNew && (
            <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              {[
                { id: 'details', label: 'Detalhes' },
                { id: 'comments', label: `Comentários (${comments.length})` },
                { id: 'history', label: 'Histórico' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Details tab */}
          {(isNew || activeTab === 'details') && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Title */}
              <div>
                <label className="label">Título *</label>
                <input
                  {...register('title', { required: true })}
                  disabled={mode === 'view'}
                  className="input-field"
                  placeholder="Descreva brevemente a tarefa..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="label">Descrição</label>
                <textarea
                  {...register('description')}
                  disabled={mode === 'view'}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Detalhes, passos, contexto..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="label">Categoria</label>
                  <input {...register('category')} disabled={mode === 'view'} className="input-field" placeholder="Ex: Infra, Suporte..." />
                </div>

                {/* Status */}
                <div>
                  <label className="label">Status</label>
                  <select {...register('status')} disabled={mode === 'view'} className="input-field">
                    {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="label">Prioridade</label>
                  <select {...register('priority')} disabled={mode === 'view'} className="input-field">
                    {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>

                {/* Criticality */}
                <div>
                  <label className="label">Criticidade</label>
                  <select {...register('criticality')} disabled={mode === 'view'} className="input-field">
                    {CRITICALITIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>

                {/* Team */}
                <div>
                  <label className="label">Equipe</label>
                  <select {...register('team_id')} disabled={mode === 'view'} className="input-field">
                    <option value="">Sem equipe</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <label className="label">Responsável</label>
                  <select {...register('assignee_id')} disabled={mode === 'view'} className="input-field">
                    <option value="">Não atribuído</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                </div>

                {/* Due date */}
                <div>
                  <label className="label">Prazo</label>
                  <input type="date" {...register('due_date')} disabled={mode === 'view'} className="input-field" />
                </div>

                {/* SLA */}
                <div>
                  <label className="label">SLA (horas)</label>
                  <input type="number" {...register('sla_hours')} disabled={mode === 'view'} min={1} className="input-field" />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="label">Tags (separadas por vírgula)</label>
                <input {...register('tags')} disabled={mode === 'view'} className="input-field" placeholder="ex: urgente, rede, servidor" />
              </div>

              {/* SLA progress (view mode) */}
              {!isNew && task?.sla_deadline && (
                <div className="mt-2">
                  <SLATimer task={task} />
                </div>
              )}

              {/* Actions */}
              {mode === 'edit' && (
                <div className="flex justify-end gap-2 pt-2">
                  {!isNew && (
                    <button type="button" onClick={() => setMode('view')} className="btn-ghost">
                      Cancelar
                    </button>
                  )}
                  <button type="submit" disabled={submitting} className="btn-primary">
                    <Save size={14} />
                    {submitting ? 'Salvando...' : (isNew ? 'Criar Tarefa' : 'Salvar')}
                  </button>
                </div>
              )}
              {mode === 'view' && canEdit && (
                <div className="flex justify-between pt-2">
                  {can('canDeleteTasks') && (
                    <button type="button" onClick={handleDelete} className="btn-danger">
                      <Trash2 size={14} /> Excluir
                    </button>
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
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {comments.length === 0 && (
                  <div className="text-center py-8 text-slate-600 text-sm">Sem comentários ainda</div>
                )}
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
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    rows={2}
                    className="input-field resize-none flex-1 text-xs"
                    placeholder="Adicionar comentário..."
                    onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddComment() }}
                  />
                  <button onClick={handleAddComment} className="btn-primary self-end">
                    <Send size={13} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* History tab */}
          {!isNew && activeTab === 'history' && (
            <div className="space-y-2">
              {history.length === 0 && (
                <div className="text-center py-8 text-slate-600 text-sm">Sem histórico</div>
              )}
              {history.map(entry => (
                <div key={entry.id} className="flex items-start gap-3 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
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
      </div>
    </Modal>
  )
}
