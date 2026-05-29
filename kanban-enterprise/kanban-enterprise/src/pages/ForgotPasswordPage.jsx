import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuthStore()
  const { register, handleSubmit } = useForm()

  const onSubmit = async ({ email }) => {
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch {
      toast.error('Erro ao enviar email')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg-900 flex items-center justify-center p-4 relative">
      <div className="bg-grid-pattern absolute inset-0 opacity-40" />
      <motion.div className="w-full max-w-sm z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="glass rounded-2xl p-6">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
              <h2 className="text-sm font-semibold text-slate-200 mb-1" style={{ fontFamily: 'Syne' }}>Email enviado!</h2>
              <p className="text-xs text-slate-500 mb-4">Verifique sua caixa de entrada para redefinir a senha.</p>
              <Link to="/login" className="btn-primary justify-center">Voltar ao Login</Link>
            </div>
          ) : (
            <>
              <h2 className="text-sm font-semibold text-slate-200 mb-1" style={{ fontFamily: 'Syne' }}>Recuperar Senha</h2>
              <p className="text-xs text-slate-500 mb-4">Enviaremos um link para redefinir sua senha.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="email" {...register('email', { required: true })} className="input-field pl-9" placeholder="seu@email.com" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full btn-primary justify-center py-2.5">
                  {loading ? 'Enviando...' : 'Enviar Link'}
                </button>
              </form>
              <Link to="/login" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mt-4">
                <ArrowLeft size={12} /> Voltar
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
