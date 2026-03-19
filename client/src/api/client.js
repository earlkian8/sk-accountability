import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
})

// ── Barangays ──────────────────────────────────────────
export const fetchBarangays = () =>
  api.get('/barangays').then(r => r.data)

// ── Programs ───────────────────────────────────────────
export const fetchPrograms = (barangayId) =>
  api.get('/programs', { params: { barangayId } }).then(r => r.data)

export const fetchProgramById = (id) =>
  api.get(`/programs/${id}`).then(r => r.data)

export const createProgram = (payload) =>
  api.post('/programs', payload).then(r => r.data)

// ── Votes ──────────────────────────────────────────────
export const castVote = (programId, voterId, voteType) =>
  api.post(`/programs/${programId}/vote`, { voterId, voteType }).then(r => r.data)

// ── Comments ───────────────────────────────────────────
export const addComment = (programId, payload) =>
  api.post(`/programs/${programId}/comments`, payload).then(r => r.data)

// ── Upload ─────────────────────────────────────────────
export const uploadPhoto = (file) => {
  const form = new FormData()
  form.append('photo', file)
  return api.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data.url)
}