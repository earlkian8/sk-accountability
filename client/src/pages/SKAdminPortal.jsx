/**
 * src/pages/SKAdminPortal.jsx
 * SK Official Admin Portal — dark command-center aesthetic
 * Features: manage programs (add/edit/delete/status), set barangay budget
 */

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import {
  createProgram, updateProgram, deleteProgram as apiDeleteProgram,
  uploadPhoto, getBarangayBudget, updateBarangayBudget,
} from '../api/client'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Plus, Pencil, Trash2, X, Check,
  Upload, ImagePlus, Loader2, Shield, ChevronDown,
  PhilippinePeso, Calendar, Tag, AlertTriangle,
  CheckCircle2, Clock, Flag, BarChart3, Wallet,
  ArrowLeft, Eye, Save, RefreshCw, Settings, MapPin
} from 'lucide-react'
import skLogo from '../assets/sk-logo.svg'

const CATEGORIES = ['Health', 'Sports', 'Livelihood', 'Environment', 'Culture']
const STATUSES   = ['pending', 'verified', 'flagged']

const STATUS_CFG = {
  pending:  { label: 'Pending',  color: '#c9a800', bg: 'rgba(252,209,22,0.12)',  border: 'rgba(252,209,22,0.3)',  icon: Clock },
  verified: { label: 'Verified', color: '#16a34a', bg: 'rgba(22,163,74,0.15)',  border: 'rgba(22,163,74,0.3)',  icon: CheckCircle2 },
  flagged:  { label: 'Flagged',  color: '#ce1126', bg: 'rgba(206,17,38,0.15)',  border: 'rgba(206,17,38,0.3)',  icon: Flag },
}

const CAT_COLORS = {
  Health:      '#38bdf8',
  Sports:      '#fb923c',
  Livelihood:  '#9b7fee',
  Environment: '#4ade80',
  Culture:     '#f472b6',
}

// ── Stat card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = '#7eb3ff' }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 14, padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'border-color 0.2s',
    }}
      onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'}
      onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <div>
        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, color: 'white', lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Status badge (admin style) ───────────────────────────────
function AdminStatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending
  const Icon = cfg.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 700, color: cfg.color,
    }}>
      <Icon size={10} />
      {cfg.label}
    </span>
  )
}

// ── Confirm delete modal ─────────────────────────────────────
function DeleteModal({ program, onConfirm, onCancel, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#00163a', border: '1px solid rgba(206,17,38,0.3)',
        borderRadius: 16, padding: 32, maxWidth: 400, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        animation: 'adminPopIn 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(206,17,38,0.15)', border: '1px solid rgba(206,17,38,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Trash2 size={20} style={{ color: '#f04556' }} />
        </div>
        <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'white', marginBottom: 8 }}>I-delete ang Programa?</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: 24 }}>
          Permanenteng matatanggal ang <strong style={{ color: 'white' }}>"{program?.name}"</strong> kasama ang lahat ng votes at komento nito. Hindi ito mababawi.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} disabled={loading} style={{
            flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            Huwag
          </button>
          <button onClick={onConfirm} disabled={loading} style={{
            flex: 1, padding: '11px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #ce1126, #a50e1e)',
            color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: '0 4px 16px rgba(206,17,38,0.4)',
          }}>
            {loading ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
            {loading ? 'Dine-delete...' : 'I-delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Program form modal (add / edit) ──────────────────────────
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
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      let photoUrl = program?.photoUrl || null
      if (photoFile) photoUrl = await uploadPhoto(photoFile)

      const payload = {
        ...form,
        budget: parseInt(form.budget),
        barangayId:   barangayCode,
        barangayName: barangayName,
        photoUrl,
      }

      if (isEdit) {
        await onSave(program.id, payload)
      } else {
        await onSave(payload)
      }
    } catch (err) {
      toast.error(err.message || 'Error saving program.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 13px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)', color: 'white',
    fontSize: 13, outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      overflowY: 'auto',
    }}>
      <div style={{
        background: '#001a3d', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18, width: '100%', maxWidth: 560,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        animation: 'adminPopIn 0.25s cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden', margin: 'auto',
      }}>
        {/* Modal header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: isEdit ? 'rgba(252,209,22,0.15)' : 'rgba(96,165,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isEdit ? <Pencil size={14} style={{ color: '#fcd116' }} /> : <Plus size={14} style={{ color: '#7eb3ff' }} />}
            </div>
            <div>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: 'white', marginBottom: 1 }}>
                {isEdit ? 'I-edit ang Programa' : 'Bagong Programa'}
              </h3>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Brgy. {barangayName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Name */}
          <div>
            <label style={labelStyle}>Pangalan ng Programa *</label>
            <input style={inputStyle} required placeholder="hal. Kabataan Health Caravan 2026"
              value={form.name} onChange={e => f('name', e.target.value)}
              onFocus={e => e.target.style.borderColor = 'rgba(96,165,250,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Category + Budget */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Kategorya *</label>
              <select style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }} required value={form.category} onChange={e => f('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} style={{ background: '#001a3d' }}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Pondo (₱) *</label>
              <input style={inputStyle} type="number" required min="1" placeholder="45000"
                value={form.budget} onChange={e => f('budget', e.target.value)}
                onFocus={e => e.target.style.borderColor = 'rgba(96,165,250,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </div>

          {/* Date + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Petsa *</label>
              <input style={{ ...inputStyle, colorScheme: 'dark' }} type="date" required value={form.date} onChange={e => f('date', e.target.value)}
                onFocus={e => e.target.style.borderColor = 'rgba(96,165,250,0.6)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, cursor: 'pointer', appearance: 'none',
                color: STATUS_CFG[form.status]?.color || 'white',
              }} value={form.status} onChange={e => f('status', e.target.value)}>
                {STATUSES.map(s => (
                  <option key={s} value={s} style={{ background: '#001a3d', color: STATUS_CFG[s]?.color }}>
                    {STATUS_CFG[s]?.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Paglalarawan *</label>
            <textarea style={{ ...inputStyle, resize: 'none', minHeight: 90 }} required rows={4}
              placeholder="Ilarawan ang programa, sino ang nakikinabang, at kung paano ginastos ang pondo..."
              value={form.description} onChange={e => f('description', e.target.value)}
              onFocus={e => e.target.style.borderColor = 'rgba(96,165,250,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {/* Photo */}
          <div>
            <label style={labelStyle}>Larawan / Katibayan</label>
            {photoPreview ? (
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
                <img src={photoPreview} alt="preview" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                  style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={13} />
                </button>
              </div>
            ) : (
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 10, padding: '24px',
                cursor: 'pointer', transition: 'all 0.15s', background: 'rgba(255,255,255,0.02)',
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(96,165,250,0.4)'; e.currentTarget.style.background = 'rgba(96,165,250,0.05)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
              >
                <ImagePlus size={18} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 6 }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>I-upload ang larawan</span>
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} disabled={saving} style={{
              flex: 1, padding: '11px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              Kanselahin
            </button>
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: '11px', borderRadius: 10, border: 'none',
              background: isEdit
                ? 'linear-gradient(135deg, #c9a800, #a08900)'
                : 'linear-gradient(135deg, #0038a8, #002d87)',
              color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: isEdit ? '0 4px 16px rgba(252,209,22,0.35)' : '0 4px 16px rgba(0,56,168,0.4)',
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

// ── Budget settings panel ────────────────────────────────────
function BudgetPanel({ barangayCode, barangayName, onClose }) {
  const [annualBudget, setAnnualBudget]   = useState('')
  const [tenPctBudget, setTenPctBudget]   = useState('')
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)

  useEffect(() => {
    if (!barangayCode) return
    getBarangayBudget(barangayCode)
      .then(data => {
        setAnnualBudget(data.annualBudget || '')
        setTenPctBudget(data.tenPercentBudget || '')
      })
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
      toast.success('Na-update ang budget!')
      onClose()
    } catch {
      toast.error('Hindi ma-save ang budget.')
    } finally {
      setSaving(false)
    }
  }

  const computed10Pct = annualBudget ? Math.round(parseInt(annualBudget) * 0.10) : 0

  const inputStyle = {
    width: '100%', padding: '11px 13px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)', color: 'white',
    fontSize: 14, outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#001a3d', border: '1px solid rgba(252,209,22,0.2)',
        borderRadius: 18, width: '100%', maxWidth: 440,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        animation: 'adminPopIn 0.25s cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(252,209,22,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(252,209,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={14} style={{ color: '#fcd116' }} />
            </div>
            <div>
              <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: 'white', marginBottom: 1 }}>Budget Settings</h3>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Brgy. {barangayName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <Loader2 size={20} style={{ color: 'rgba(255,255,255,0.3)' }} className="spin" />
            </div>
          ) : (
            <>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>
                  Annual SK Budget (₱)
                </label>
                <input style={inputStyle} type="number" min="0" placeholder="180000"
                  value={annualBudget} onChange={e => setAnnualBudget(e.target.value)}
                  onFocus={e => e.target.style.borderColor = 'rgba(252,209,22,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>
                  Ang kabuuang pondo ng SK para sa taong ito.
                </p>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 6 }}>
                  10% SK Fund (₱)
                </label>
                <input style={inputStyle} type="number" min="0"
                  placeholder={computed10Pct ? `Computed: ₱${computed10Pct.toLocaleString()}` : '18000'}
                  value={tenPctBudget} onChange={e => setTenPctBudget(e.target.value)}
                  onFocus={e => e.target.style.borderColor = 'rgba(252,209,22,0.5)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                {annualBudget && !tenPctBudget && (
                  <div style={{
                    marginTop: 8, padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(252,209,22,0.08)', border: '1px solid rgba(252,209,22,0.15)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: 12, color: '#fcd116', fontWeight: 600 }}>
                      Auto-computed: ₱{computed10Pct.toLocaleString()}
                    </span>
                    <button type="button" onClick={() => setTenPctBudget(computed10Pct.toString())} style={{
                      fontSize: 11, color: '#fcd116', background: 'rgba(252,209,22,0.15)',
                      border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontWeight: 600,
                    }}>
                      Gamitin ito
                    </button>
                  </div>
                )}
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>
                  Ang mandatory na 10% na nakalaan para sa SK programs (RA 10742).
                </p>
              </div>

              {/* Budget breakdown preview */}
              {annualBudget && (
                <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Preview</p>
                  {[
                    { label: 'Annual Budget',  val: parseInt(annualBudget), color: '#7eb3ff' },
                    { label: '10% SK Fund',    val: tenPctBudget ? parseInt(tenPctBudget) : computed10Pct, color: '#fcd116' },
                    { label: 'Remaining 90%',  val: parseInt(annualBudget) - (tenPctBudget ? parseInt(tenPctBudget) : computed10Pct), color: '#4ade80' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item.label}</span>
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
                boxShadow: '0 4px 16px rgba(252,209,22,0.35)',
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

// ─────────────────────────────────────────────────────────────
// MAIN ADMIN PORTAL
// ─────────────────────────────────────────────────────────────
export function SKAdminPortal({ onBack }) {
  const {
    programs, selectedBarangay, selectedCity, selectedProvince, selectedRegion,
    userRole, setUserRole, addProgram, updateProgramInStore, removeProgramFromStore,
    loading,
  } = useAppStore()

  const [activeTab, setActiveTab]         = useState('programs') // programs | settings
  const [showAddModal, setShowAddModal]   = useState(false)
  const [editProgram, setEditProgram]     = useState(null)
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [deletingId, setDeletingId]       = useState(null)
  const [showBudget, setShowBudget]       = useState(false)
  const [filterStatus, setFilterStatus]   = useState('all')
  const [filterCat, setFilterCat]         = useState('all')
  const [searchQuery, setSearchQuery]     = useState('')

  // Redirect if not SK official
  useEffect(() => {
    if (userRole !== 'sk-official') {
      toast.error('SK Official access only.')
      onBack()
    }
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

  const handleAdd = async (payload) => {
    const program = await createProgram(payload)
    addProgram(program)
    setShowAddModal(false)
    toast.success('Naidagdag ang programa!')
  }

  const handleEdit = async (id, payload) => {
    const updated = await updateProgram(id, payload)
    updateProgramInStore(updated)
    setEditProgram(null)
    toast.success('Na-update ang programa!')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    try {
      await apiDeleteProgram(deleteTarget.id)
      removeProgramFromStore(deleteTarget.id)
      setDeleteTarget(null)
      toast.success('Na-delete ang programa.')
    } catch {
      toast.error('Hindi ma-delete. Subukan ulit.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (program, newStatus) => {
    try {
      const updated = await updateProgram(program.id, { ...program, status: newStatus })
      updateProgramInStore(updated)
      toast.success(`Status updated to ${STATUS_CFG[newStatus].label}`)
    } catch {
      toast.error('Hindi ma-update ang status.')
    }
  }

  const noBarangay = !selectedBarangay

  // ── CSS vars for dark theme ──────────────────────────────
  const dark = {
    bg:        '#00112e',
    surface:   '#001a3d',
    surface2:  '#002050',
    border:    'rgba(255,255,255,0.07)',
    border2:   'rgba(255,255,255,0.04)',
    text:      'rgba(255,255,255,0.9)',
    textMuted: 'rgba(255,255,255,0.4)',
    textDim:   'rgba(255,255,255,0.2)',
  }

  return (
    <div style={{ minHeight: '100vh', background: dark.bg, color: dark.text, fontFamily: 'inherit' }}>

      {/* ── TOP NAV ─────────────────────────────────────────── */}
      <header style={{
        background: dark.surface,
        borderBottom: `1px solid ${dark.border}`,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        {/* Accent stripe */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #0038a8 0%, #fcd116 50%, #ce1126 100%)' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={onBack} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              border: `1px solid ${dark.border}`,
              background: 'rgba(255,255,255,0.04)',
              color: dark.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
              onMouseOver={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
              onMouseOut={e => { e.currentTarget.style.color = dark.textMuted; e.currentTarget.style.borderColor = dark.border }}
            >
              <ArrowLeft size={13} /> Dashboard
            </button>

            <div style={{ width: 1, height: 20, background: dark.border }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={skLogo} alt="SK" style={{ width: 30, height: 30, borderRadius: 8, background: 'white', padding: 3, objectFit: 'contain' }} />
              <div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: 'white', letterSpacing: '-0.01em', lineHeight: 1 }}>SK Admin Portal</div>
                <div style={{ fontSize: 10, color: dark.textDim, marginTop: 1 }}>Sangguniang Kabataan</div>
              </div>
            </div>

            {/* Barangay pill */}
            {selectedBarangay && (
              <div style={{
                padding: '4px 12px', borderRadius: 99,
                background: 'rgba(0,56,168,0.15)', border: '1px solid rgba(0,56,168,0.3)',
                fontSize: 12, fontWeight: 600, color: '#7eb3ff',
              }}>
                Brgy. {selectedBarangay.name}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {selectedBarangay && (
              <button onClick={() => setShowBudget(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 9,
                border: '1px solid rgba(252,209,22,0.25)',
                background: 'rgba(252,209,22,0.08)',
                color: '#fcd116', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(252,209,22,0.15)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(252,209,22,0.08)'}
              >
                <Wallet size={13} /> Budget Settings
              </button>
            )}

            {selectedBarangay && (
              <button onClick={() => setShowAddModal(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 9, border: 'none',
                background: 'linear-gradient(135deg, #0038a8, #002d87)',
                color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,56,168,0.4)',
                transition: 'all 0.15s',
              }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,56,168,0.55)'}
                onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,56,168,0.4)'}
              >
                <Plus size={14} /> Bagong Programa
              </button>
            )}

            {/* Role indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 8,
              background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.2)',
            }}>
              <Shield size={12} style={{ color: '#4ade80' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80' }}>SK Official</span>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px' }}>

        {/* ── NO BARANGAY SELECTED ─────────────────────────── */}
        {noBarangay && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '60vh', gap: 16, textAlign: 'center',
          }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: `1px solid ${dark.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={28} style={{ color: dark.textDim }} />
            </div>
            <div>
              <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'white', marginBottom: 8 }}>Walang Barangay na Pinili</p>
              <p style={{ fontSize: 13, color: dark.textMuted, maxWidth: 320 }}>
                Bumalik sa dashboard at piliin ang iyong barangay mula sa address selector bago gamitin ang admin portal.
              </p>
            </div>
            <button onClick={onBack} style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #0038a8, #002d87)',
              color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <ArrowLeft size={14} /> Bumalik sa Dashboard
            </button>
          </div>
        )}

        {/* ── MAIN CONTENT ─────────────────────────────────── */}
        {!noBarangay && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── STAT CARDS ─────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <StatCard icon={BarChart3}    label="Kabuuang Programa" value={programs.length}   color="#7eb3ff" />
              <StatCard icon={CheckCircle2} label="Verified"          value={verifiedCount}     color="#4ade80" />
              <StatCard icon={Clock}        label="Pending"           value={pendingCount}      color="#fcd116" />
              <StatCard icon={Flag}         label="Flagged"           value={flaggedCount}      color="#f47a87" />
              <StatCard icon={PhilippinePeso} label="Total Budget"
                value={`₱${(totalBudget / 1000).toFixed(0)}k`}
                sub={`₱${totalBudget.toLocaleString()} total`}
                color="#9b7fee"
              />
            </div>

            {/* ── FILTERS + SEARCH ───────────────────────── */}
            <div style={{
              display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
              padding: '14px 16px', borderRadius: 12,
              background: dark.surface, border: `1px solid ${dark.border}`,
            }}>
              <input
                placeholder="Hanapin ang programa..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, minWidth: 160, padding: '8px 12px', borderRadius: 8,
                  border: `1px solid ${dark.border}`,
                  background: 'rgba(255,255,255,0.04)', color: 'white',
                  fontSize: 13, outline: 'none', fontFamily: 'inherit',
                }}
              />

              {/* Status filter */}
              <div style={{ display: 'flex', gap: 4 }}>
                {['all', 'pending', 'verified', 'flagged'].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)} style={{
                    padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                    background: filterStatus === s
                      ? s === 'all' ? 'rgba(255,255,255,0.12)' : STATUS_CFG[s]?.bg
                      : 'rgba(255,255,255,0.04)',
                    color: filterStatus === s
                      ? s === 'all' ? 'white' : STATUS_CFG[s]?.color
                      : dark.textMuted,
                    textTransform: 'capitalize',
                  }}>
                    {s === 'all' ? 'Lahat' : STATUS_CFG[s]?.label}
                  </button>
                ))}
              </div>

              {/* Category filter */}
              <select
                value={filterCat} onChange={e => setFilterCat(e.target.value)}
                style={{
                  padding: '7px 12px', borderRadius: 8,
                  border: `1px solid ${dark.border}`,
                  background: dark.surface2, color: dark.textMuted,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none',
                }}
              >
                <option value="all" style={{ background: '#001a3d' }}>Lahat ng Kategorya</option>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#001a3d' }}>{c}</option>)}
              </select>

              <span style={{ fontSize: 12, color: dark.textDim, marginLeft: 'auto' }}>
                {filtered.length} programa
              </span>
            </div>

            {/* ── PROGRAMS TABLE ─────────────────────────── */}
            <div style={{
              background: dark.surface, border: `1px solid ${dark.border}`,
              borderRadius: 14, overflow: 'hidden',
            }}>
              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 100px 120px 110px 90px 110px',
                padding: '10px 20px',
                borderBottom: `1px solid ${dark.border}`,
                background: 'rgba(255,255,255,0.02)',
              }}>
                {['Programa', 'Kategorya', 'Budget', 'Petsa', 'Status', 'Aksyon'].map(h => (
                  <span key={h} style={{ fontSize: 10, fontWeight: 700, color: dark.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
                ))}
              </div>

              {/* Loading */}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                  <Loader2 size={22} style={{ color: dark.textDim }} className="spin" />
                </div>
              )}

              {/* Empty */}
              {!loading && filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '56px 24px' }}>
                  <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: dark.textMuted, marginBottom: 6 }}>
                    {programs.length === 0 ? 'Wala pang programa' : 'Walang tugma sa filter'}
                  </p>
                  <p style={{ fontSize: 12, color: dark.textDim }}>
                    {programs.length === 0 ? 'I-click ang "Bagong Programa" para magsimula.' : 'Baguhin ang iyong filter o search query.'}
                  </p>
                </div>
              )}

              {/* Rows */}
              {!loading && filtered.map((p, i) => (
                <div key={p.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 100px 120px 110px 90px 110px',
                  padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? `1px solid ${dark.border2}` : 'none',
                  alignItems: 'center', transition: 'background 0.12s',
                  animation: `adminRowIn 0.3s ease ${i * 0.04}s both`,
                }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Name + description */}
                  <div style={{ paddingRight: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2, lineHeight: 1.3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: 11, color: dark.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.description || '—'}
                    </p>
                  </div>

                  {/* Category */}
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: CAT_COLORS[p.category] || '#7eb3ff',
                    background: `${CAT_COLORS[p.category] || '#7eb3ff'}18`,
                    padding: '3px 8px', borderRadius: 6, display: 'inline-block',
                  }}>
                    {p.category}
                  </span>

                  {/* Budget */}
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, color: '#9b7fee' }}>
                    ₱{Number(p.budget).toLocaleString()}
                  </span>

                  {/* Date */}
                  <span style={{ fontSize: 12, color: dark.textMuted }}>
                    {new Date(p.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>

                  {/* Status dropdown */}
                  <div style={{ position: 'relative' }}>
                    <select
                      value={p.status}
                      onChange={e => handleStatusChange(p, e.target.value)}
                      style={{
                        padding: '4px 8px', borderRadius: 7,
                        border: `1px solid ${STATUS_CFG[p.status]?.border || dark.border}`,
                        background: STATUS_CFG[p.status]?.bg || 'transparent',
                        color: STATUS_CFG[p.status]?.color || 'white',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        outline: 'none', appearance: 'none',
                        paddingRight: 20,
                      }}
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s} style={{ background: '#001a3d', color: STATUS_CFG[s]?.color }}>
                          {STATUS_CFG[s]?.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={10} style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', color: STATUS_CFG[p.status]?.color, pointerEvents: 'none' }} />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setEditProgram(p)}
                      title="I-edit"
                      style={{
                        width: 30, height: 30, borderRadius: 8, border: 'none',
                        background: 'rgba(252,209,22,0.1)', color: '#fcd116',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(252,209,22,0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(252,209,22,0.1)'}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      title="I-delete"
                      style={{
                        width: 30, height: 30, borderRadius: 8, border: 'none',
                        background: 'rgba(206,17,38,0.1)', color: '#f47a87',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(206,17,38,0.2)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(206,17,38,0.1)'}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── MODALS ──────────────────────────────────────────── */}
      {showAddModal && (
        <ProgramModal
          barangayCode={selectedBarangay?.code}
          barangayName={selectedBarangay?.name}
          onSave={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editProgram && (
        <ProgramModal
          program={editProgram}
          barangayCode={selectedBarangay?.code}
          barangayName={selectedBarangay?.name}
          onSave={handleEdit}
          onClose={() => setEditProgram(null)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          program={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={!!deletingId}
        />
      )}

      {showBudget && (
        <BudgetPanel
          barangayCode={selectedBarangay?.code}
          barangayName={selectedBarangay?.name}
          onClose={() => setShowBudget(false)}
        />
      )}

      <style>{`
        @keyframes adminPopIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        @keyframes adminRowIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @media (max-width: 768px) {
          .admin-table-row { grid-template-columns: 1fr 80px 100px !important; }
        }
      `}</style>
    </div>
  )
}