import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Kanban, ListTodo, Users, Settings,
  LogOut, ChevronRight, Building2, Activity, Bell, Shield
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { ROLES } from '../../lib/constants'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/kanban', icon: Kanban, label: 'Kanban Board' },
  { to: '/tasks', icon: ListTodo, label: 'Tarefas' },
  { to: '/teams', icon: Building2, label: 'Equipes', roles: ['administrador', 'gestor'] },
  { to: '/users', icon: Users, label: 'Usuários', roles: ['administrador'] },
  { to: '/settings', icon: Settings, label: 'Configurações', roles: ['administrador'] },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { profile, signOut, isRole } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch {
      toast.error('Erro ao sair')
    }
  }

  const roleInfo = ROLES.find(r => r.id === profile?.role)

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.some(r => isRole(r))
  )

  return (
    <motion.aside
      className="fixed left-0 top-0 h-full z-30 flex flex-col"
      style={{
        width: collapsed ? '60px' : '220px',
        background: 'rgba(8, 12, 20, 0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        transition: 'width 0.25s ease',
      }}
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/5 flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
            <rect x="2" y="2" width="12" height="8" rx="2" fill="#3b82f6"/>
            <rect x="18" y="2" width="12" height="8" rx="2" fill="#3b82f6" opacity="0.6"/>
            <rect x="2" y="14" width="12" height="8" rx="2" fill="#3b82f6" opacity="0.6"/>
            <rect x="18" y="14" width="12" height="8" rx="2" fill="#3b82f6" opacity="0.4"/>
          </svg>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <div className="text-sm font-bold text-white leading-none" style={{ fontFamily: 'Syne' }}>OpsKanban</div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">Enterprise v1.0</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden">
        <div className="space-y-0.5">
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `menu-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={16} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                    className="text-xs font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </div>

        {/* Status indicator */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className={`flex items-center gap-2 px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 status-pulse flex-shrink-0" />
            {!collapsed && <span className="text-xs text-slate-500">Sistema Online</span>}
          </div>
        </div>
      </nav>

      {/* User profile */}
      <div className="p-2 border-t border-white/5">
        <div
          className={`flex items-center gap-2 px-2 py-2 rounded-lg overflow-hidden ${collapsed ? 'justify-center' : ''}`}
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
            style={{ background: roleInfo?.color ? `${roleInfo.color}30` : 'rgba(59,130,246,0.2)', border: `1px solid ${roleInfo?.color || '#3b82f6'}40` }}>
            {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <div className="text-xs font-medium text-slate-200 truncate">{profile?.full_name}</div>
                <div className="text-[10px] truncate" style={{ color: roleInfo?.color }}>
                  {roleInfo?.label}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout}
                className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                title="Sair"
              >
                <LogOut size={13} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        {collapsed && (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center p-2 mt-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer z-10"
        style={{ background: '#0d1220', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={12} className="text-slate-400" />
        </motion.div>
      </button>
    </motion.aside>
  )
}
