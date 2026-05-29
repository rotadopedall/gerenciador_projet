import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Settings, Clock, Bell, Shield, Database, Save, Check } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const SLA_PRESETS = [
  { label: 'Baixa', hours: 72 },
  { label: 'Normal', hours: 24 },
  { label: 'Alta', hours: 8 },
  { label: 'Crítica', hours: 2 },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')
  const [saved, setSaved] = useState(false)
  const { profile, fetchProfile } = useAuthStore()

  const { register, handleSubmit } = useForm({
    defaultValues: {
      full_name: profile?.full_name || '',
      email: profile?.email || '',
    }
  })

  const { register: regPw, handleSubmit: handlePw, reset: resetPw, watch } = useForm()

  const handleSaveProfile = async (data) => {
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: data.full_name,
      }).eq('id', profile.id)
      if (error) throw error
      await fetchProfile(profile.id)
      toast.success('Perfil atualizado!')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: data.newPassword })
      if (error) throw error
      toast.success('Senha alterada com sucesso!')
      resetPw()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const sections = [
    { id: 'profile', icon: Shield, label: 'Meu Perfil' },
    { id: 'password', icon: Settings, label: 'Senha' },
    { id: 'sla', icon: Clock, label: 'Configurar SLA' },
    { id: 'system', icon: Database, label: 'Sistema' },
  ]

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-48 flex-shrink-0">
        <div className="space-y-0.5">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`menu-item w-full text-left ${activeSection === s.id ? 'active' : ''}`}
            >
              <s.icon size={14} />
              <span className="text-xs">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-lg">
        {activeSection === 'profile' && (
          <motion.div className="card space-y-4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="section-title">Meu Perfil</h2>
            <form onSubmit={handleSubmit(handleSaveProfile)} className="space-y-4">
              <div>
                <label className="label">Nome Completo</label>
                <input {...register('full_name')} className="input-field" />
              </div>
              <div>
                <label className="label">Email</label>
                <input {...register('email')} disabled className="input-field opacity-50 cursor-not-allowed" />
                <p className="text-[10px] text-slate-600 mt-1">Email não pode ser alterado aqui</p>
              </div>
              <div>
                <label className="label">Perfil de Acesso</label>
                <div className="input-field opacity-50 cursor-not-allowed capitalize">{profile?.role}</div>
              </div>
              <button type="submit" className="btn-primary">
                {saved ? <Check size={14} className="text-green-400" /> : <Save size={14} />}
                {saved ? 'Salvo!' : 'Salvar Alterações'}
              </button>
            </form>
          </motion.div>
        )}

        {activeSection === 'password' && (
          <motion.div className="card space-y-4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="section-title">Alterar Senha</h2>
            <form onSubmit={handlePw(handleChangePassword)} className="space-y-4">
              <div>
                <label className="label">Nova Senha</label>
                <input type="password" {...regPw('newPassword', { required: true, minLength: 6 })} className="input-field" placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="label">Confirmar Nova Senha</label>
                <input type="password" {...regPw('confirmPassword', { required: true })} className="input-field" />
              </div>
              <button type="submit" className="btn-primary">
                <Save size={14} /> Alterar Senha
              </button>
            </form>
          </motion.div>
        )}

        {activeSection === 'sla' && (
          <motion.div className="card space-y-4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="section-title">Configuração de SLA</h2>
            <p className="text-xs text-slate-500">Defina os prazos padrão de SLA por prioridade.</p>
            <div className="space-y-3">
              {SLA_PRESETS.map((preset, i) => (
                <div key={preset.label} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div className="text-xs font-medium text-slate-200">{preset.label}</div>
                    <div className="text-[10px] text-slate-500">Prioridade {preset.label.toLowerCase()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      defaultValue={preset.hours}
                      min={1}
                      className="input-field w-20 h-8 text-xs text-center"
                    />
                    <span className="text-xs text-slate-500">horas</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary">
              <Save size={14} /> Salvar Configurações
            </button>
          </motion.div>
        )}

        {activeSection === 'system' && (
          <motion.div className="card space-y-4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="section-title">Informações do Sistema</h2>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Versão', value: '1.0.0' },
                { label: 'Plataforma', value: 'OpsKanban Enterprise' },
                { label: 'Backend', value: 'Supabase (PostgreSQL)' },
                { label: 'Frontend', value: 'React + Vite + TailwindCSS' },
                { label: 'Realtime', value: 'Supabase Realtime (WebSocket)' },
                { label: 'Hospedagem', value: 'Netlify' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="text-slate-300 font-mono">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 status-pulse" />
                <span className="text-xs text-green-400">Todos os serviços operacionais</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
