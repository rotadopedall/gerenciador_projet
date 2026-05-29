import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useTeamsStore = create((set, get) => ({
  teams: [],
  members: [],
  loading: false,

  fetchTeams: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        manager:profiles!teams_manager_id_fkey(id, full_name, email),
        supervisor:profiles!teams_supervisor_id_fkey(id, full_name, email)
      `)
      .eq('is_active', true)
      .order('name')

    if (!error) set({ teams: data || [] })
    set({ loading: false })
  },

  fetchMembers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, teams(id, name, color)')
      .eq('is_active', true)
      .order('full_name')

    if (!error) set({ members: data || [] })
  },

  createTeam: async (teamData) => {
    const { data, error } = await supabase
      .from('teams')
      .insert([teamData])
      .select()
      .single()
    if (error) throw error
    await get().fetchTeams()
    return data
  },

  updateTeam: async (id, updates) => {
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    await get().fetchTeams()
    return data
  },

  deleteTeam: async (id) => {
    const { error } = await supabase
      .from('teams')
      .update({ is_active: false })
      .eq('id', id)
    if (error) throw error
    await get().fetchTeams()
  },

  assignMemberToTeam: async (userId, teamId) => {
    const { error } = await supabase
      .from('profiles')
      .update({ team_id: teamId })
      .eq('id', userId)
    if (error) throw error
    await get().fetchMembers()
  },
}))
