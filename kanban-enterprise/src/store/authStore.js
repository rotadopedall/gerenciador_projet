import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { ROLE_PERMISSIONS } from '../lib/constants'

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  permissions: {},

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await get().fetchProfile(session.user.id)
    }
    set({ session, loading: false })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session })
      if (session?.user) {
        await get().fetchProfile(session.user.id)
      } else {
        set({ user: null, profile: null, permissions: {} })
      }
    })
  },

  fetchProfile: async (userId) => {
    // Try simple query first (no joins to avoid RLS issues)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (!error && data) {
      // Try to also get team data
      let profile = data
      if (data.team_id) {
        const { data: team } = await supabase
          .from('teams')
          .select('*')
          .eq('id', data.team_id)
          .maybeSingle()
        if (team) profile = { ...data, teams: team }
      }
      set({
        profile,
        user: profile,
        permissions: ROLE_PERMISSIONS[data.role] || {},
      })
    } else {
      // Fallback to auth metadata
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const fallbackRole = user.user_metadata?.role || 'administrador'
        const fallbackProfile = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          role: fallbackRole,
        }
        set({
          profile: fallbackProfile,
          user: fallbackProfile,
          permissions: ROLE_PERMISSIONS[fallbackRole] || {},
        })
      }
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, session: null, permissions: {} })
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  },

  can: (permission) => {
    const { permissions } = get()
    return !!permissions[permission]
  },

  isRole: (...roles) => {
    const { profile } = get()
    if (!profile?.role) return false
    return roles.includes(profile.role)
  },
}))
