import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Select({ value, onChange, options, placeholder = 'Selecionar...', disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find(o => o.value === value)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="input-field flex items-center justify-between cursor-pointer text-left"
        style={{ minHeight: '38px' }}
      >
        <span className={selected ? 'text-slate-200' : 'text-slate-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronDown size={14} className="text-slate-500 flex-shrink-0 ml-2" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute z-50 w-full mt-1 rounded-xl overflow-hidden"
            style={{
              background: '#0d1220',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            <div className="max-h-52 overflow-y-auto p-1">
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all cursor-pointer text-left"
                  style={{
                    color: value === opt.value ? '#60a5fa' : '#cbd5e1',
                    background: value === opt.value ? 'rgba(59,130,246,0.12)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (value !== opt.value) e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="flex items-center gap-2">
                    {opt.dot && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: opt.dot }} />}
                    <span>{opt.label}</span>
                    {opt.sub && <span className="text-xs text-slate-500">{opt.sub}</span>}
                  </div>
                  {value === opt.value && <Check size={12} className="text-blue-400 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
