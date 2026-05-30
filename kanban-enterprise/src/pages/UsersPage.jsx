import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Search, Shield, UserCheck, UserX } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { useTeamsStore } from '../store/teamsStore'
import { useAuthStore } from '../store/authStore'
import { ROLES } from '../lib/constants'
import { supabase } from '../lib/supabase'
import Modal from '../components/shared/Modal'
import Select from '../components/shared/Select'
import toast from 'react-hot-toast'

function UserForm({ user, onSave, onClose }) {
  const { teams } = useTeamsStore()
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, control } = useForm({
    defaultValues: user ? {
      full_name: user.full_name,
      role: user.role || 'tecnico',
      team_id: user.team_id || '',
    } : { role: 'tecnico', team_id: '' }
  })

  const roleOptions = ROLES.map(r => ({ value: r.id, label: r.label, dot: r.color }))
  const teamOptions = [
    { value: '', label: 'Sem equipe' },
    ...teams.map(t => ({ value: t.id, label: t.name, dot: t.color }))
  ]

  const handleSave = async (data) => {
    setSaving(true)
    await onSave(data)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit(handleSave)} className="p-5 space-y-4">
      <div>
        <label className="label">Nome Completo *</label>
        <input {...register('full_name', { required: true })} className="input-field" placeholder="Nome do usuário" />
      </div>
      {!user && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Email *</label>
            <input type="email" {...register('email', { required: true })} className="input-field" placeholder="email@empresa.com" />
          </div>
          <div>
            <label className="label">Senha inicial *</label>
            <input type="password" {...register('password', { required: !user, minLength: 6 })} className="input-field" placeholder="Mínimo 6 caracteres" />
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Perfil de Acesso</label>
          <Controller name="role" control={control}
            render={({ field }) => <Select value={field.value} onChange={field.onChange} options={roleOptions} />} />
        </div>
        <div>
          <label className="label">Equipe</label>
          <Controller name="team_id" control={control}
            render={({ field }) => <Select value={field.value} onChange={field.onChange} options={teamOptions} placeholder="Sem equipe" />} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? (
            <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
          ) : null}
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const { members, fetchMembers, teams } = useTeamsStore()
  const { can } = useAuthStore()

  const filtered = members.filter(m =>
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  )

  const closeModal = () => {
    setShowModal(false)
    setEditUser(null)
  }

  const handleSave = async (data) => {
    try {
      if (editUser) {
        const { error } = await supabase.from('profiles').update({
          full_name: data.full_name,
          role: data.role,
          team_id: data.team_id || null,
        }).eq('id', editUser.id)
        if (error) throw error
        toast.success('Usuário atualizado!')
        closeModal()
        await fetchMembers()
      } else {
        // Step 1: create auth user
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: { data: { full_name: data.full_name, role: data.role } },
        })

        if (signUpError) throw signUpError

        const userId = authData?.user?.id
        if (!userId) throw new Error('Não foi possível criar o usuário')

        // Step 2: upsert profile immediately
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: data.full_name,
          email: data.email,
          role: data.role,
          team_id: data.team_id || null,
          is_active: true,
        }, { onConflict: 'id' })

        // Step 3: close modal first, then refresh
        toast.success(`Usuário ${data.full_name} criado!`)
        closeModal()

        // Refresh after a short delay
        setTimeout(async () => {
          await fetchMembers()
        }, 500)
      }
    } catch (err) {
      console.error(err)
      // Even on partial error, if user was created close the modal
      if (err.message?.includes('already registered')) {
        toast.error('Este email já está cadastrado')
      } else {
        toast.error(err.message || 'Erro ao salvar usuário')
        // Close modal anyway if it looks like it was created
        closeModal()
        setTimeout(() => fetchMembers(), 500)
      }
    }
  }

  const handleToggleActive = async (user) => {
    try {
      await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id)
      await fetchMembers()
      toast.success(user.is_active ? 'Usuário desativado' : 'Usuário ativado')
    } catch { toast.error('Erro') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar usuários..." className="input-field pl-9 h-8 text-xs" />
        </div>
        <span className="text-xs text-slate-500">{filtered.length} usuários</span>
        {can('canCreateUsers') && (
          <button onClick={() => { setEditUser(null); setShowModal(true) }} className="btn-primary text-xs">
            <Plus size={14} /> Novo Usuário
          </button>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Usuário', 'Email', 'Perfil', 'Equipe', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-mono">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-slate-600">Nenhum usuário encontrado</td></tr>
            )}
            {filtered.map((user, i) => {
              const role = ROLES.find(r => r.id === user.role)
              const team = teams.find(t => t.id === user.team_id)
              return (
                <motion.tr key={user.id} className="border-b border-white/4 hover:bg-white/3 transition-colors"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: role?.color ? `${role.color}25` : 'rgba(59,130,246,0.2)', border: `1px solid ${role?.color || '#3b82f6'}30` }}>
                        {user.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-slate-200 font-medium">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="badge" style={{ color: role?.color, background: `${role?.color}15` }}>
                      <Shield size={9} className="mr-1" />{role?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {team ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: team.color }} />
                        <span className="text-slate-400">{team.name}</span>
                      </div>
                    ) : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${user.is_active ? 'text-green-400' : 'text-slate-600'}`}
                      style={{ background: user.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)' }}>
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {can('canEditUsers') && (
                        <button onClick={() => { setEditUser(user); setShowModal(true) }}
                          className="p-1.5 rounded text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer">
                          <Edit2 size={12} />
                        </button>
                      )}
                      {can('canDeleteUsers') && (
                        <button onClick={() => handleToggleActive(user)}
                          className="p-1.5 rounded text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all cursor-pointer">
                          {user.is_active ? <UserX size={12} /> : <UserCheck size={12} />}
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && (
          <Modal title={editUser ? 'Editar Usuário' : 'Novo Usuário'} onClose={closeModal}>
            <UserForm user={editUser} onSave={handleSave} onClose={closeModal} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
