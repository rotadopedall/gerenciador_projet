import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, Users, Shield } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTeamsStore } from '../store/teamsStore'
import { useAuthStore } from '../store/authStore'
import Modal from '../components/shared/Modal'
import toast from 'react-hot-toast'

const TEAM_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#f97316']

function TeamForm({ team, onSave, onClose }) {
  const { members } = useTeamsStore()
  const { register, handleSubmit } = useForm({
    defaultValues: team || { color: '#3b82f6' }
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="p-5 space-y-4">
      <div>
        <label className="label">Nome da Equipe *</label>
        <input {...register('name', { required: true })} className="input-field" placeholder="Ex: NOC - Nível 1" />
      </div>
      <div>
        <label className="label">Descrição</label>
        <textarea {...register('description')} rows={2} className="input-field resize-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Gestor</label>
          <select {...register('manager_id')} className="input-field">
            <option value="">Selecionar...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Supervisor</label>
          <select {...register('supervisor_id')} className="input-field">
            <option value="">Selecionar...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Cor</label>
        <div className="flex gap-2 flex-wrap mt-1">
          {TEAM_COLORS.map(color => (
            <label key={color} className="cursor-pointer">
              <input type="radio" {...register('color')} value={color} className="sr-only" />
              <div className="w-6 h-6 rounded-lg border-2 transition-all"
                style={{ background: color, borderColor: 'transparent' }}
                onClick={() => {}}
              />
            </label>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-primary">Salvar Equipe</button>
      </div>
    </form>
  )
}

export default function TeamsPage() {
  const [showModal, setShowModal] = useState(false)
  const [editTeam, setEditTeam] = useState(null)
  const { teams, members, createTeam, updateTeam, deleteTeam } = useTeamsStore()
  const { can } = useAuthStore()

  const handleSave = async (data) => {
    try {
      if (editTeam) {
        await updateTeam(editTeam.id, data)
        toast.success('Equipe atualizada!')
      } else {
        await createTeam(data)
        toast.success('Equipe criada!')
      }
      setShowModal(false)
      setEditTeam(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Desativar esta equipe?')) return
    try {
      await deleteTeam(id)
      toast.success('Equipe desativada')
    } catch { toast.error('Erro') }
  }

  const getTeamMembers = (teamId) => members.filter(m => m.team_id === teamId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{teams.length} equipes ativas</span>
        {can('canManageTeams') && (
          <button onClick={() => { setEditTeam(null); setShowModal(true) }} className="btn-primary text-xs">
            <Plus size={14} /> Nova Equipe
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team, i) => {
          const tm = getTeamMembers(team.id)
          return (
            <motion.div
              key={team.id}
              className="card glass-hover"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ borderLeft: `3px solid ${team.color}` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200" style={{ fontFamily: 'Syne' }}>{team.name}</h3>
                  {team.description && <p className="text-xs text-slate-500 mt-0.5">{team.description}</p>}
                </div>
                {can('canManageTeams') && (
                  <div className="flex gap-1">
                    <button onClick={() => { setEditTeam(team); setShowModal(true) }} className="p-1.5 rounded text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(team.id)} className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs">
                {team.manager && (
                  <div className="flex items-center gap-2">
                    <Shield size={11} className="text-blue-400" />
                    <span className="text-slate-500">Gestor:</span>
                    <span className="text-slate-300">{team.manager.full_name}</span>
                  </div>
                )}
                {team.supervisor && (
                  <div className="flex items-center gap-2">
                    <Shield size={11} className="text-cyan-400" />
                    <span className="text-slate-500">Supervisor:</span>
                    <span className="text-slate-300">{team.supervisor.full_name}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Users size={11} className="text-slate-500" />
                  <span className="text-[10px] text-slate-500">{tm.length} membros</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tm.slice(0, 6).map(m => (
                    <div
                      key={m.id}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: `${team.color}30`, border: `1px solid ${team.color}40` }}
                      title={m.full_name}
                    >
                      {m.full_name?.charAt(0)}
                    </div>
                  ))}
                  {tm.length > 6 && (
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] text-slate-500" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      +{tm.length - 6}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}

        {teams.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-600">
            <Users size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma equipe cadastrada</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <Modal
            title={editTeam ? 'Editar Equipe' : 'Nova Equipe'}
            onClose={() => { setShowModal(false); setEditTeam(null) }}
          >
            <TeamForm team={editTeam} onSave={handleSave} onClose={() => { setShowModal(false); setEditTeam(null) }} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
