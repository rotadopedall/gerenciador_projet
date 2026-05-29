import { motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ title, onClose, children, size = 'md', subtitle }) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className={`relative w-full ${sizes[size]} max-h-[90vh] flex flex-col rounded-2xl overflow-hidden`}
        style={{
          background: 'rgba(13,18,32,0.98)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        }}
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/6 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-100" style={{ fontFamily: 'Syne' }}>{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all cursor-pointer ml-4"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}
