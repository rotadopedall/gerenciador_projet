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

    if (!error && data) set({ teams: data })
    else if (error) {
      // Fallback: fetch without joins
      const { data: simple } = await supabase
        .from('teams').select('*').eq('is_active', true).order('name')
      if (simple) set({ teams: simple })
    }
    set({ loading: false })
  },

  fetchMembers: async () => {
    // Simple fetch first - no joins
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .order('full_name')

    if (!error && data) {
      // Enrich with team data separately
      const { data: teams } = await supabase.from('teams').select('id, name, color')
      const teamsMap = {}
      if (teams) teams.forEach(t => { teamsMap[t.id] = t })

      const enriched = data.map(m => ({
        ...m,
        teams: m.team_id ? teamsMap[m.team_id] : null
      }))
      set({ members: enriched })
    } else {
      console.error('fetchMembers error:', error)
    }
  },

  createTeam: async (teamData) => {
    const { data, error } = await supabase
      .from('teams').insert([teamData]).select().single()
    if (error) throw error
    await get().fetchTeams()
    return data
  },

  updateTeam: async (id, updates) => {
    const { data, error } = await supabase
      .from('teams').update(updates).eq('id', id).select().single()
    if (error) throw error
    await get().fetchTeams()
    return data
  },

  deleteTeam: async (id) => {
    const { error } = await supabase
      .from('teams').update({ is_active: false }).eq('id', id)
    if (error) throw error
    await get().fetchTeams()
  },

  assignMemberToTeam: async (userId, teamId) => {
    const { error } = await supabase
      .from('profiles').update({ team_id: teamId }).eq('id', userId)
    if (error) throw error
    await get().fetchMembers()
  },
}))
