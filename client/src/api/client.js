/**
 * src/api/client.js
 */
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
})

const psgc = axios.create({
  baseURL: 'https://psgc.cloud/api',
  timeout: 10000,
})

// ── PSGC Philippine Address ────────────────────────────────
export const fetchRegions    = ()             => psgc.get('/regions').then(r => r.data)
export const fetchProvinces  = (regionCode)   => psgc.get(`/regions/${regionCode}/provinces`).then(r => r.data)
export const fetchCities     = (provinceCode) => psgc.get(`/provinces/${provinceCode}/cities-municipalities`).then(r => r.data)
export const fetchBarangays  = (cityCode)     => psgc.get(`/cities-municipalities/${cityCode}/barangays`).then(r => r.data)

// ── Programs ──────────────────────────────────────────────
export const fetchPrograms    = (barangayCode) => api.get('/programs', { params: { barangayId: barangayCode } }).then(r => r.data)
export const fetchProgramById = (id)           => api.get(`/programs/${id}`).then(r => r.data)
export const createProgram    = (payload)      => api.post('/programs', payload).then(r => r.data)
export const updateProgram    = (id, payload)  => api.patch(`/programs/${id}`, payload).then(r => r.data)
export const deleteProgram    = (id)           => api.delete(`/programs/${id}`).then(r => r.data)

// ── Votes ─────────────────────────────────────────────────
export const castVote = (programId, voterId, voteType) =>
  api.post(`/programs/${programId}/vote`, { voterId, voteType }).then(r => r.data)

// ── Comments ──────────────────────────────────────────────
export const addComment = (programId, payload) =>
  api.post(`/programs/${programId}/comments`, payload).then(r => r.data)

// ── Upload ────────────────────────────────────────────────
export const uploadPhoto = (file) => {
  const form = new FormData()
  form.append('photo', file)
  return api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data.url)
}

// ── Barangay Budget ───────────────────────────────────────
export const getBarangayBudget    = (barangayCode)          => api.get(`/barangays/${barangayCode}/budget`).then(r => r.data)
export const updateBarangayBudget = (barangayCode, payload) => api.patch(`/barangays/${barangayCode}/budget`, payload).then(r => r.data)