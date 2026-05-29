import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, Zap } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuthStore()
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async ({ email, password }) => {
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Bem-vindo!')
    } catch (err) {
      toast.error('Email ou senha incorretos')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-grid-pattern absolute inset-0 opacity-40" />
      
      {/* Ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(59,130,246,0.06)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl" style={{ background: 'rgba(139,92,246,0.04)' }} />

      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 relative"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect x="2" y="2" width="12" height="8" rx="2" fill="#3b82f6"/>
              <rect x="18" y="2" width="12" height="8" rx="2" fill="#3b82f6" opacity="0.6"/>
              <rect x="2" y="14" width="12" height="8" rx="2" fill="#3b82f6" opacity="0.6"/>
              <rect x="18" y="14" width="12" height="8" rx="2" fill="#3b82f6" opacity="0.4"/>
              <rect x="2" y="24" width="12" height="6" rx="2" fill="#3b82f6" opacity="0.3"/>
              <rect x="18" y="24" width="12" height="6" rx="2" fill="#3b82f6" opacity="0.2"/>
            </svg>
            <div className="absolute inset-0 rounded-2xl blur-lg" style={{ background: 'rgba(59,130,246,0.2)' }} />
          </div>
          <h1 className="text-2xl font-bold text-white text-glow" style={{ fontFamily: 'Syne' }}>OpsKanban</h1>
          <p className="text-sm text-slate-500 mt-1">Enterprise Operations Platform</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6" style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  {...register('email', { required: true })}
                  className="input-field pl-9"
                  placeholder="ops@empresa.com"
                />
              </div>
            </div>
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: true })}
                  className="input-field pl-9 pr-9"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Esqueci minha senha
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-2.5"
              style={{ background: loading ? '#1d4ed8' : '#2563eb' }}
            >
              {loading ? (
                <motion.div
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
              ) : <Zap size={14} />}
              {loading ? 'Autenticando...' : 'Entrar na Plataforma'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-600 mt-6">
          Plataforma de Operações Corporativas — NOC/SOC/Service Desk
        </p>
      </motion.div>
    </div>
  )
}
