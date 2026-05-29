import { useState, useEffect } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { getSLAStatus, formatSLATime } from '../../lib/constants'

export default function SLATimer({ task, compact = false }) {
  const [sla, setSla] = useState(() => getSLAStatus(task))

  useEffect(() => {
    if (!task.sla_deadline) return
    const interval = setInterval(() => {
      setSla(getSLAStatus(task))
    }, 30000) // update every 30s
    return () => clearInterval(interval)
  }, [task.sla_deadline])

  if (!sla) return null

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded ${sla.expired ? 'sla-warning-blink' : ''}`}
        style={{ color: sla.color, background: sla.bg, border: `1px solid ${sla.color}30` }}
      >
        {sla.expired ? <AlertTriangle size={9} /> : <Clock size={9} />}
        {sla.expired ? '-' : ''}{formatSLATime(sla.remaining)}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-500 flex items-center gap-1">
          <Clock size={10} />
          SLA
        </span>
        <span style={{ color: sla.color }} className={`font-mono font-medium ${sla.expired ? 'sla-warning-blink' : ''}`}>
          {sla.expired ? `Vencido há ${formatSLATime(sla.remaining)}` : `${formatSLATime(sla.remaining)} restantes`}
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.max(0, Math.min(100, sla.percentRemaining))}%`,
            background: sla.color,
            boxShadow: `0 0 8px ${sla.color}60`,
          }}
        />
      </div>
    </div>
  )
}
