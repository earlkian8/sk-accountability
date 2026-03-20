/**
 * src/pages/SKAdminPortal.jsx
 * SK Official Admin Portal — fully responsive (mobile / tablet / desktop)
 */

import { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import {
  createProgram, updateProgram, deleteProgram as apiDeleteProgram,
  uploadPhoto, getBarangayBudget, updateBarangayBudget,
} from '../api/client'
import toast from 'react-hot-toast'
import {
  Plus, Pencil, Trash2, X, ImagePlus, Loader2, Shield,
  PhilippinePeso, CheckCircle2, Clock, Flag, BarChart3,
  Wallet, ArrowLeft, Save, MapPin, Search, SlidersHorizontal,
} from 'lucide-react'
import skLogo from '../assets/sk-logo.svg'

const CATEGORIES = ['Health', 'Sports', 'Livelihood', 'Environment', 'Culture']

const STATUS_CFG = {
  pending:  { label: 'Pending',  color: '#92400e', bg: 'var(--yellow-light)', border: '#fde68a',  icon: Clock },
  verified: { label: 'Verified', color: 'var(--green)', bg: 'var(--green-light)', border: '#bbf7d0', icon: CheckCircle2 },
  flagged:  { label: 'Flagged',  color: 'var(--red)',   bg: 'var(--red-light)',   border: '#fecaca', icon: Flag },
}

const CAT_COLORS = {
  Health:      '#38bdf8',
  Sports:      '#fb923c',
  Livelihood:  '#9b7fee',
  Environment: '#4ade80',
  Culture:     '#f472b6',
}

// ── Stat card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'var(--blue)' }) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--gray-200)',
      borderRadius: 14, padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'border-color 0.2s', boxShadow: 'var(--shadow-sm)',
    }}
      onMouseOver={e => e.currentTarget.style.borderColor = 'var(--gray-300)'}
      onMouseOut={e => e.currentTarget.style.borderColor = 'var(--gray-200)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--blue-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} style={{ color }} />
        </div>
      </div>
      <div>
        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: 'var(--gray-900)', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Status badge ─────────────────────────────────────────────
function AdminStatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending
  const Icon = cfg.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap',
    }}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

// ── Delete confirm modal ─────────────────────────────────────
function DeleteModal({ program, onConfirm, onCancel, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: 'white', border: '1px solid #fecaca',
        borderRadius: 16, padding: 28, maxWidth: 400, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        animation: 'adminPopIn 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--red-light)', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Trash2 size={18} style={{ color: 'var(--red)' }} />
        </div>
        <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, color: 'var(--gray-900)', marginBottom: 8 }}>I-delete ang Programa?</h3>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.65, marginBottom: 22 }}>
          Permanenteng matatanggal ang <strong style={{ color: 'var(--gray-900)' }}>"{program?.name}"</strong> kasama ang lahat ng votes at komento. Hindi ito mababawi.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} disabled={loading} style={{
            flex: 1, padding: '10px', borderRadius: 10,
            border: '1px solid var(--gray-200)', background: 'var(--gray-50)',
            color: 'var(--gray-600)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>Huwag</button>
          <button onClick={onConfirm} disabled={loading} style={{
            flex: 1, padding: '10px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, var(--red), #a50e1e)',
            color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: '0 4px 16px rgba(206,17,38,0.3)',
          }}>
            {loading ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
            {loading ? 'Dine-delete...' : 'I-delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Program form modal ───────────────────────────────────────
function ProgramModal({ program, barangayCode, barangayName, onSave, onClose }) {
  const isEdit = !!program
  const [form, setForm] = useState({
    name:        program?.name        || '',
    category:    program?.category    || 'Health',
    budget:      program?.budget      || '',
    date:        program?.date        || '',
    description: program?.description || '',
    status:      program?.status      || 'pending',
  })
  const [photoFile, setPhotoFile]       = useState(null)
  const [photoPreview, setPhotoPreview] = useState(program?.photoUrl || null)
  const [saving, setSaving]             = useState(false)
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handlePhoto = e => {
    const file = e.target.files[0]; if (!file) return
    setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true)
    try {
      let photoUrl = program?.photoUrl || null
      if (photoFile) photoUrl = await uploadPhoto(photoFile)
      const payload = { ...form, budget: parseInt(form.budget), barangayId: barangayCode, barangayName, photoUrl }
      isEdit ? await onSave(program.id, payload) : await onSave(payload)
    } catch (err) {
      toast.error(err.message || 'Error saving program.')
    } finally { setSaving(false) }
  }

  const inputStyle = {
    width: '100%', padding: '10px 13px', borderRadius: 10,
    border: '1px solid var(--gray-200)', background: 'white',
    color: 'var(--gray-900)', fontSize: 13, outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.15s', boxSizing: 'border-box',
  }
  const labelStyle = {
    fontSize: 11, fontWeight: 700, color: 'var(--gray-400)',
    textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: 0, overflowY: 'auto',
    }} className="modal-overlay">
      <div style={{
        background: 'white', border: '1px solid var(--gray-200)',
        borderRadius: '18px 18px 0 0', width: '100%', maxWidth: 560,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
        animation: 'adminSlideUp 0.28s cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden',
      }} className="modal-sheet">
        {/* Drag handle for mobile */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--gray-200)' }} />
        </div>

        {/* Modal header */}
        <div style={{
          padding: '12px 20px 16px', borderBottom: '1px solid var(--gray-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--gray-50)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: isEdit ? 'var(--yellow-light)' : 'var(--blue-pale)',
              border: `1px solid ${isEdit ? '#fde68a' : 'var(--blue-light)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isEdit ? <Pencil size={14} style={{ color: '#92400e' }} /> : <Plus size={14} style={{ color: 'var(--blue)' }} />}
            </div>
            <div>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: 'var(--gray-900)', lineHeight: 1 }}>
                {isEdit ? 'I-edit ang Programa' : 'Bagong Programa'}
              </h3>
              <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>Brgy. {barangayName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8,
            border: '1px solid var(--gray-200)', background: 'white',
            color: 'var(--gray-400)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflowY: 'auto' }}>

          <div>
            <label style={labelStyle}>Pangalan ng Programa *</label>
            <input style={inputStyle} required placeholder="hal. Kabataan Health Caravan 2026"
              value={form.name} onChange={e => f('name', e.target.value)}
              onFocus={e => e.target.style.borderColor = 'var(--blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Kategorya *</label>
              <select style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }} required value={form.category} onChange={e => f('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Pondo (₱) *</label>
              <input style={inputStyle} type="number" required min="1" placeholder="45000"
                value={form.budget} onChange={e => f('budget', e.target.value)}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Petsa *</label>
            <input style={inputStyle} type="date" required value={form.date} onChange={e => f('date', e.target.value)}
              onFocus={e => e.target.style.borderColor = 'var(--blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
          </div>

          <div>
            <label style={labelStyle}>Paglalarawan *</label>
            <textarea style={{ ...inputStyle, resize: 'none', minHeight: 90 }} required rows={4}
              placeholder="Ilarawan ang programa, sino ang nakikinabang, at kung paano ginastos ang pondo..."
              value={form.description} onChange={e => f('description', e.target.value)}
              onFocus={e => e.target.style.borderColor = 'var(--blue)'}
              onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
          </div>

          <div>
            <label style={labelStyle}>Larawan / Katibayan</label>
            {photoPreview ? (
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
                <img src={photoPreview} alt="preview" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                  style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed var(--gray-200)', borderRadius: 10, padding: '20px',
                cursor: 'pointer', transition: 'all 0.15s', background: 'var(--gray-50)',
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'var(--blue-pale)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'var(--gray-50)' }}>
                <ImagePlus size={18} style={{ color: 'var(--gray-300)', marginBottom: 6 }} />
                <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 500 }}>I-upload ang larawan</span>
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} disabled={saving} style={{
              flex: 1, padding: '11px', borderRadius: 10,
              border: '1px solid var(--gray-200)', background: 'var(--gray-50)',
              color: 'var(--gray-600)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Kanselahin</button>
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: '11px', borderRadius: 10, border: 'none',
              background: isEdit ? 'linear-gradient(135deg, #c9a800, #a08900)' : 'linear-gradient(135deg, var(--blue), #002d87)',
              color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: isEdit ? '0 4px 16px rgba(252,209,22,0.35)' : '0 4px 16px rgba(0,56,168,0.3)',
            }}>
              {saving ? <Loader2 size={14} className="spin" /> : isEdit ? <Save size={14} /> : <Plus size={14} />}
              {saving ? 'Sine-save...' : isEdit ? 'I-save ang Pagbabago' : 'Idagdag ang Programa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Budget settings modal ────────────────────────────────────
function BudgetPanel({ barangayCode, barangayName, onClose }) {
  const [annualBudget, setAnnualBudget] = useState('')
  const [tenPctBudget, setTenPctBudget] = useState('')
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(false)

  useEffect(() => {
    if (!barangayCode) return
    getBarangayBudget(barangayCode)
      .then(data => { setAnnualBudget(data.annualBudget || ''); setTenPctBudget(data.tenPercentBudget || '') })
      .catch(() => toast.error('Hindi ma-load ang budget data.'))
      .finally(() => setLoading(false))
  }, [barangayCode])

  const handleSave = async () => {
    if (!annualBudget) { toast.error('Ilagay ang annual budget.'); return }
    setSaving(true)
    try {
      await updateBarangayBudget(barangayCode, {
        annualBudget:     parseInt(annualBudget),
        tenPercentBudget: tenPctBudget ? parseInt(tenPctBudget) : Math.round(parseInt(annualBudget) * 0.10),
        barangayName,
      })
      toast.success('Na-update ang budget!'); onClose()
    } catch { toast.error('Hindi ma-save ang budget.') }
    finally { setSaving(false) }
  }

  const computed10Pct = annualBudget ? Math.round(parseInt(annualBudget) * 0.10) : 0

  const inputStyle = {
    width: '100%', padding: '11px 13px', borderRadius: 10,
    border: '1px solid var(--gray-200)', background: 'white',
    color: 'var(--gray-900)', fontSize: 14, outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.15s', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 0,
    }} className="modal-overlay">
      <div style={{
        background: 'white', border: '1px solid #fde68a',
        borderRadius: '18px 18px 0 0', width: '100%', maxWidth: 480,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
        animation: 'adminSlideUp 0.28s cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden',
      }} className="modal-sheet">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#fde68a' }} />
        </div>
        <div style={{ padding: '12px 22px 16px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--yellow-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={14} style={{ color: '#92400e' }} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: '#92400e', lineHeight: 1 }}>Budget Settings</h3>
              <p style={{ fontSize: 11, color: '#92400e', opacity: 0.7, marginTop: 2 }}>Brgy. {barangayName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #fde68a', background: 'white', color: '#92400e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '70vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <Loader2 size={20} style={{ color: 'var(--blue)' }} className="spin" />
            </div>
          ) : (
            <>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>Annual SK Budget (₱)</label>
                <input style={inputStyle} type="number" min="0" placeholder="180000"
                  value={annualBudget} onChange={e => setAnnualBudget(e.target.value)}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
                <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 5 }}>Ang kabuuang pondo ng SK para sa taong ito.</p>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>10% SK Fund (₱)</label>
                <input style={inputStyle} type="number" min="0"
                  placeholder={computed10Pct ? `Computed: ₱${computed10Pct.toLocaleString()}` : '18000'}
                  value={tenPctBudget} onChange={e => setTenPctBudget(e.target.value)}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--gray-200)'} />
                {annualBudget && !tenPctBudget && (
                  <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--yellow-light)', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>Auto-computed: ₱{computed10Pct.toLocaleString()}</span>
                    <button type="button" onClick={() => setTenPctBudget(computed10Pct.toString())} style={{ fontSize: 11, color: '#92400e', background: '#fde68a', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}>Gamitin ito</button>
                  </div>
                )}
                <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 5 }}>Ang mandatory na 10% na nakalaan para sa SK programs (RA 10742).</p>
              </div>
              {annualBudget && (
                <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Preview</p>
                  {[
                    { label: 'Annual Budget', val: parseInt(annualBudget), color: 'var(--blue)' },
                    { label: '10% SK Fund',   val: tenPctBudget ? parseInt(tenPctBudget) : computed10Pct, color: '#92400e' },
                    { label: 'Remaining 90%', val: parseInt(annualBudget) - (tenPctBudget ? parseInt(tenPctBudget) : computed10Pct), color: 'var(--green)' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--gray-100)' }}>
                      <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{item.label}</span>
                      <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: item.color }}>₱{isNaN(item.val) ? 0 : item.val.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={handleSave} disabled={saving} style={{
                width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #c9a800, #a08900)',
                color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                boxShadow: '0 4px 16px rgba(201,168,0,0.35)',
              }}>
                {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
                {saving ? 'Sine-save...' : 'I-save ang Budget'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Program card (mobile view) ───────────────────────────────
function ProgramCard({ p, onEdit, onDelete }) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--gray-200)',
      borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.name}
          </p>
          <p style={{ fontSize: 12, color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.description || '—'}
          </p>
        </div>
        <AdminStatusBadge status={p.status} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: CAT_COLORS[p.category] || 'var(--blue)',
          background: `${CAT_COLORS[p.category] || '#0038a8'}18`,
          padding: '2px 8px', borderRadius: 6,
        }}>{p.category}</span>
        <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--blue)' }}>
          ₱{Number(p.budget).toLocaleString()}
        </span>
        <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 'auto' }}>
          {new Date(p.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--gray-100)', paddingTop: 10 }}>
        <button onClick={() => onEdit(p)} style={{
          flex: 1, padding: '8px', borderRadius: 8,
          border: '1px solid #fde68a', background: 'var(--yellow-light)', color: '#92400e',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}>
          <Pencil size={12} /> I-edit
        </button>
        <button onClick={() => onDelete(p)} style={{
          flex: 1, padding: '8px', borderRadius: 8,
          border: '1px solid #fecaca', background: 'var(--red-light)', color: 'var(--red)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}>
          <Trash2 size={12} /> I-delete
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
export function SKAdminPortal({ onBack }) {
  const {
    programs, selectedBarangay,
    userRole, addProgram, updateProgramInStore, removeProgramFromStore, loading,
  } = useAppStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [editProgram, setEditProgram]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deletingId, setDeletingId]     = useState(null)
  const [showBudget, setShowBudget]     = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCat, setFilterCat]       = useState('all')
  const [searchQuery, setSearchQuery]   = useState('')
  const [showFilters, setShowFilters]   = useState(false)

  useEffect(() => {
    if (userRole !== 'sk-official') { toast.error('SK Official access only.'); onBack() }
  }, [userRole])

  const filtered = programs.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (filterCat !== 'all' && p.category !== filterCat) return false
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const totalBudget   = programs.reduce((s, p) => s + Number(p.budget), 0)
  const verifiedCount = programs.filter(p => p.status === 'verified').length
  const pendingCount  = programs.filter(p => p.status === 'pending').length
  const flaggedCount  = programs.filter(p => p.status === 'flagged').length

  const handleAdd    = async (payload) => { const program = await createProgram(payload); addProgram(program); setShowAddModal(false); toast.success('Naidagdag ang programa!') }
  const handleEdit   = async (id, payload) => { const updated = await updateProgram(id, payload); updateProgramInStore(updated); setEditProgram(null); toast.success('Na-update ang programa!') }
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    try { await apiDeleteProgram(deleteTarget.id); removeProgramFromStore(deleteTarget.id); setDeleteTarget(null); toast.success('Na-delete ang programa.') }
    catch { toast.error('Hindi ma-delete. Subukan ulit.') }
    finally { setDeletingId(null) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header style={{ background: 'var(--blue)', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 16px rgba(0,56,168,0.25)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--yellow) 0%, var(--yellow) 60%, var(--red) 60%, var(--red) 100%)' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <button onClick={onBack} className="btn btn-ghost" style={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', padding: '6px 10px', fontSize: 12, flexShrink: 0 }}>
              <ArrowLeft size={13} /> <span className="hidden-mobile">Dashboard</span>
            </button>
            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <img src={skLogo} alt="SK" style={{ width: 30, height: 30, borderRadius: 7, background: 'white', padding: 3, objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: 'white', letterSpacing: '-0.01em', lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>SK Admin Portal</div>
              <div className="hidden-mobile" style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 1 }}>Sangguniang Kabataan</div>
            </div>
            {selectedBarangay && (
              <div className="hidden-mobile" style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 600, color: 'white', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Brgy. {selectedBarangay.name}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {selectedBarangay && (
              <button onClick={() => setShowBudget(true)} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8,
                border: '1px solid rgba(252,209,22,0.4)', background: 'rgba(252,209,22,0.15)',
                color: 'var(--yellow)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
                <Wallet size={13} /> <span className="hidden-mobile">Budget</span>
              </button>
            )}
            {selectedBarangay && (
              <button onClick={() => setShowAddModal(true)} className="btn" style={{
                background: 'var(--yellow)', color: 'var(--blue-dark)',
                padding: '6px 12px', fontWeight: 700, fontSize: 12,
              }}>
                <Plus size={13} /> <span className="hidden-mobile">Bagong Programa</span>
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <Shield size={12} style={{ color: 'var(--yellow)' }} />
              <span className="hidden-mobile" style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>SK Official</span>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '16px' }}>

        {/* ── NO BARANGAY ───────────────────────────────────── */}
        {!selectedBarangay && (
          <div className="surface slide-up" style={{ textAlign: 'center', padding: '56px 24px', marginTop: 8 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--blue-pale)', border: '1px solid var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <MapPin size={24} style={{ color: 'var(--blue)' }} />
            </div>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'var(--gray-900)', marginBottom: 8 }}>Walang Barangay na Pinili</p>
            <p style={{ fontSize: 13, color: 'var(--gray-400)', maxWidth: 280, margin: '0 auto 20px' }}>
              Bumalik sa dashboard at piliin ang iyong barangay bago gamitin ang admin portal.
            </p>
            <button onClick={onBack} className="btn btn-primary" style={{ padding: '10px 20px', justifyContent: 'center' }}>
              <ArrowLeft size={14} /> Bumalik sa Dashboard
            </button>
          </div>
        )}

        {selectedBarangay && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Barangay pill on mobile */}
            <div className="show-mobile" style={{ padding: '6px 14px', borderRadius: 99, background: 'var(--blue-pale)', border: '1px solid var(--blue-light)', fontSize: 12, fontWeight: 600, color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
              <MapPin size={11} /> Brgy. {selectedBarangay.name}
            </div>

            {/* ── STAT CARDS ──────────────────────────────── */}
            <div className="admin-stats-grid">
              <StatCard icon={BarChart3}      label="Programa"       value={programs.length}  color="var(--blue)" />
              <StatCard icon={CheckCircle2}   label="Verified"       value={verifiedCount}    color="var(--green)" />
              <StatCard icon={Clock}          label="Pending"        value={pendingCount}     color="#92400e" />
              <StatCard icon={Flag}           label="Flagged"        value={flaggedCount}     color="var(--red)" />
              <StatCard icon={PhilippinePeso} label="Total Budget"
                value={`₱${(totalBudget / 1000).toFixed(0)}k`}
                sub={`₱${totalBudget.toLocaleString()}`}
                color="var(--blue)"
              />
            </div>

            {/* ── SEARCH + FILTER TOGGLE ──────────────────── */}
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
                <input
                  placeholder="Hanapin ang programa..."
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px 9px 32px', borderRadius: 10,
                    border: '1px solid var(--gray-200)', background: 'white',
                    color: 'var(--gray-900)', fontSize: 13, outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
                />
              </div>
              <button onClick={() => setShowFilters(f => !f)} style={{
                padding: '9px 14px', borderRadius: 10,
                border: `1px solid ${showFilters ? 'var(--blue)' : 'var(--gray-200)'}`,
                background: showFilters ? 'var(--blue-pale)' : 'white',
                color: showFilters ? 'var(--blue)' : 'var(--gray-500)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              }}>
                <SlidersHorizontal size={13} />
                <span className="hidden-mobile">Filter</span>
                {(filterStatus !== 'all' || filterCat !== 'all') && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', display: 'inline-block' }} />
                )}
              </button>
            </div>

            {/* ── FILTER PANEL (collapsible) ──────────────── */}
            {showFilters && (
              <div style={{
                background: 'white', border: '1px solid var(--gray-200)',
                borderRadius: 12, padding: '14px 16px',
                display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {['all', 'pending', 'verified', 'flagged'].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} style={{
                      padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                      fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                      background: filterStatus === s ? (s === 'all' ? 'var(--blue)' : STATUS_CFG[s]?.bg) : 'var(--gray-100)',
                      color: filterStatus === s ? (s === 'all' ? 'white' : STATUS_CFG[s]?.color) : 'var(--gray-500)',
                    }}>
                      {s === 'all' ? 'Lahat' : STATUS_CFG[s]?.label}
                    </button>
                  ))}
                </div>
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{
                  padding: '7px 12px', borderRadius: 8,
                  border: '1px solid var(--gray-200)', background: 'var(--gray-50)',
                  color: 'var(--gray-600)', fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none',
                }}>
                  <option value="all">Lahat ng Kategorya</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600, marginLeft: 'auto' }}>
                  {filtered.length} programa
                </span>
              </div>
            )}

            {/* ── LOADING ─────────────────────────────────── */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                <Loader2 size={22} style={{ color: 'var(--blue)' }} className="spin" />
              </div>
            )}

            {/* ── EMPTY ───────────────────────────────────── */}
            {!loading && filtered.length === 0 && (
              <div className="surface" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--gray-600)', marginBottom: 6 }}>
                  {programs.length === 0 ? 'Wala pang programa' : 'Walang tugma sa filter'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                  {programs.length === 0 ? 'I-click ang "Bagong Programa" para magsimula.' : 'Baguhin ang iyong filter.'}
                </p>
              </div>
            )}

            {/* ── DESKTOP TABLE ───────────────────────────── */}
            {!loading && filtered.length > 0 && (
              <div className="admin-table-wrap" style={{
                background: 'white', border: '1px solid var(--gray-200)',
                borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '2fr 100px 120px 110px 90px 100px',
                  padding: '10px 20px', borderBottom: '1px solid var(--gray-100)', background: 'var(--gray-50)',
                }}>
                  {['Programa', 'Kategorya', 'Budget', 'Petsa', 'Status', 'Aksyon'].map(h => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
                  ))}
                </div>
                {filtered.map((p, i) => (
                  <div key={p.id} style={{
                    display: 'grid', gridTemplateColumns: '2fr 100px 120px 110px 90px 100px',
                    padding: '13px 20px', alignItems: 'center',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--gray-100)' : 'none',
                    transition: 'background 0.12s', minWidth: 0,
                    animation: `adminRowIn 0.3s ease ${i * 0.04}s both`,
                  }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--gray-50)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ paddingRight: 12, minWidth: 0, overflow: 'hidden' }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description || '—'}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: CAT_COLORS[p.category] || 'var(--blue)', background: `${CAT_COLORS[p.category] || '#0038a8'}18`, padding: '3px 8px', borderRadius: 6, display: 'inline-block' }}>
                      {p.category}
                    </span>
                    <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: 'var(--blue)' }}>
                      ₱{Number(p.budget).toLocaleString()}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                      {new Date(p.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <AdminStatusBadge status={p.status} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setEditProgram(p)} title="I-edit" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #fde68a', background: 'var(--yellow-light)', color: '#92400e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.background = '#fde68a'}
                        onMouseOut={e => e.currentTarget.style.background = 'var(--yellow-light)'}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(p)} title="I-delete" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #fecaca', background: 'var(--red-light)', color: 'var(--red)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.background = '#fecaca'}
                        onMouseOut={e => e.currentTarget.style.background = 'var(--red-light)'}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── MOBILE CARDS ────────────────────────────── */}
            {!loading && filtered.length > 0 && (
              <div className="admin-cards-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(p => (
                  <ProgramCard key={p.id} p={p} onEdit={setEditProgram} onDelete={setDeleteTarget} />
                ))}
              </div>
            )}

          </div>
        )}
      </main>

      {showAddModal && <ProgramModal barangayCode={selectedBarangay?.code} barangayName={selectedBarangay?.name} onSave={handleAdd} onClose={() => setShowAddModal(false)} />}
      {editProgram  && <ProgramModal program={editProgram} barangayCode={selectedBarangay?.code} barangayName={selectedBarangay?.name} onSave={handleEdit} onClose={() => setEditProgram(null)} />}
      {deleteTarget && <DeleteModal program={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={!!deletingId} />}
      {showBudget   && <BudgetPanel barangayCode={selectedBarangay?.code} barangayName={selectedBarangay?.name} onClose={() => setShowBudget(false)} />}

      <style>{`
        /* Stat cards: 2 cols mobile → 3 tablet → 5 desktop */
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        @media (min-width: 640px) {
          .admin-stats-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 1024px) {
          .admin-stats-grid { grid-template-columns: repeat(5, 1fr); }
        }

        /* Table: desktop only */
        .admin-table-wrap { display: none; }
        @media (min-width: 768px) {
          .admin-table-wrap { display: block; }
        }

        /* Cards: mobile only */
        .admin-cards-wrap { display: flex; }
        @media (min-width: 768px) {
          .admin-cards-wrap { display: none; }
        }

        /* Modals: centered on desktop, bottom sheet on mobile */
        @media (min-width: 640px) {
          .modal-overlay { align-items: center !important; padding: 16px !important; }
          .modal-sheet {
            border-radius: 18px !important;
            box-shadow: 0 24px 64px rgba(0,0,0,0.12) !important;
            animation: adminPopIn 0.25s cubic-bezier(0.16,1,0.3,1) !important;
          }
        }

        /* show-mobile utility */
        .show-mobile { display: none !important; }
        @media (max-width: 767px) {
          .show-mobile { display: inline-flex !important; }
        }

        @keyframes adminPopIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes adminSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes adminRowIn {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}