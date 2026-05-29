import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-bg-900 flex items-center justify-center">
      <div className="bg-grid-pattern absolute inset-0 opacity-50" />
      <motion.div
        className="flex flex-col items-center gap-4 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="2" y="2" width="12" height="8" rx="2" fill="#3b82f6" opacity="0.9"/>
              <rect x="18" y="2" width="12" height="8" rx="2" fill="#3b82f6" opacity="0.6"/>
              <rect x="2" y="14" width="12" height="8" rx="2" fill="#3b82f6" opacity="0.6"/>
              <rect x="18" y="14" width="12" height="8" rx="2" fill="#3b82f6" opacity="0.4"/>
              <rect x="2" y="24" width="12" height="6" rx="2" fill="#3b82f6" opacity="0.3"/>
              <rect x="18" y="24" width="12" height="6" rx="2" fill="#3b82f6" opacity="0.2"/>
            </svg>
          </div>
          <div className="absolute inset-0 rounded-2xl blur-xl bg-blue-600/20 animate-pulse-slow" />
        </div>
        <div>
          <div className="text-xl font-bold text-white text-center" style={{ fontFamily: 'Syne, sans-serif' }}>
            OpsKanban
          </div>
          <div className="text-xs text-slate-500 text-center mt-0.5 font-mono">Enterprise Platform</div>
        </div>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-500"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
