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
    const { data, error } = await supabase
      .from('profiles')
      .select('*, teams(*)')
      .eq('id', userId)
      .single()
    if (!error && data) {
      set({
        profile: data,
        user: data,
        permissions: ROLE_PERMISSIONS[data.role] || {},
      })
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
    return roles.includes(profile?.role)
  },
}))
