/**
 * src/store/appStore.js
 */
import { create } from 'zustand'
import {
  fetchRegions, fetchProvinces, fetchCities,
  fetchBarangays, fetchPrograms, castVote as apiCastVote,
} from '../api/client'

export const useAppStore = create((set, get) => ({
  // ── Address hierarchy ──
  regions:   [],
  provinces: [],
  cities:    [],
  barangays: [],

  selectedRegion:   null,
  selectedProvince: null,
  selectedCity:     null,
  selectedBarangay: null,

  // ── Programs ──
  programs: [],
  loading:  false,
  loadingAddress: false,
  error:    null,

  // ── Role ──
  userRole: 'public',
  voterId:  `voter-${Math.random().toString(36).slice(2, 9)}`,

  // ── Actions ──
  setUserRole: (role) => set({ userRole: role }),

  loadRegions: async () => {
    set({ loadingAddress: true })
    try {
      const regions = await fetchRegions()
      set({ regions, loadingAddress: false })
    } catch (e) {
      set({ error: e.message, loadingAddress: false })
    }
  },

  selectRegion: async (region) => {
    set({ selectedRegion: region, selectedProvince: null, selectedCity: null, selectedBarangay: null, provinces: [], cities: [], barangays: [], programs: [], loadingAddress: true })
    try {
      const provinces = await fetchProvinces(region.code)
      set({ provinces, loadingAddress: false })
    } catch (e) {
      set({ error: e.message, loadingAddress: false })
    }
  },

  selectProvince: async (province) => {
    set({ selectedProvince: province, selectedCity: null, selectedBarangay: null, cities: [], barangays: [], programs: [], loadingAddress: true })
    try {
      const cities = await fetchCities(province.code)
      set({ cities, loadingAddress: false })
    } catch (e) {
      set({ error: e.message, loadingAddress: false })
    }
  },

  selectCity: async (city) => {
    set({ selectedCity: city, selectedBarangay: null, barangays: [], programs: [], loadingAddress: true })
    try {
      const barangays = await fetchBarangays(city.code)
      set({ barangays, loadingAddress: false })
    } catch (e) {
      set({ error: e.message, loadingAddress: false })
    }
  },

  selectBarangay: async (barangay) => {
    set({ selectedBarangay: barangay, loading: true, programs: [] })
    try {
      const programs = await fetchPrograms(barangay.code)
      set({ programs, loading: false })
    } catch (e) {
      set({ error: e.message, loading: false })
    }
  },

  // ── Program mutations ──
  addProgram: (program) =>
    set(state => ({ programs: [program, ...state.programs] })),

  updateProgramInStore: (updated) =>
    set(state => ({
      programs: state.programs.map(p => p.id === updated.id ? updated : p)
    })),

  removeProgramFromStore: (id) =>
    set(state => ({
      programs: state.programs.filter(p => p.id !== id)
    })),

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
      throw e
    }
  },
}))