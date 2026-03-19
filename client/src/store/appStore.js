import { create } from 'zustand'
import {
  fetchBarangays,
  fetchPrograms,
  castVote as apiCastVote,
} from '../api/client'

export const useAppStore = create((set, get) => ({
  // ── State ──
  barangays: [],
  programs: [],
  selectedBarangayId: null,
  userRole: 'public',   // 'public' | 'kk-member' | 'sk-official'
  voterId: `voter-${Math.random().toString(36).slice(2, 9)}`, // anonymous session id
  loading: false,
  error: null,

  // ── Actions ──
  setUserRole: (role) => set({ userRole: role }),

  setSelectedBarangayId: async (id) => {
    set({ selectedBarangayId: id, loading: true })
    try {
      const programs = await fetchPrograms(id)
      set({ programs, loading: false })
    } catch (e) {
      set({ error: e.message, loading: false })
    }
  },

  loadBarangays: async () => {
    try {
      const barangays = await fetchBarangays()
      set({ barangays })
      // Auto-select first barangay
      if (barangays.length && !get().selectedBarangayId) {
        get().setSelectedBarangayId(barangays[0].id)
      }
    } catch (e) {
      set({ error: e.message })
    }
  },

  addProgram: (program) =>
    set(state => ({ programs: [program, ...state.programs] })),

  vote: async (programId, type) => {
    const { voterId } = get()
    try {
      const updated = await apiCastVote(programId, voterId, type)
      set(state => ({
        programs: state.programs.map(p =>
          p.id === programId
            ? { ...p, verifications: updated.verifications, flags: updated.flags, status: updated.status }
            : p
        )
      }))
    } catch (e) {
      // 409 = already voted — surface to UI via toast
      throw e
    }
  },
}))