import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { createProgram, uploadPhoto } from '../api/client'
import { AddressSelector } from '../components/AddressSelector'
import toast from 'react-hot-toast'
import { ArrowLeft, Upload, CheckCircle, Loader2, ImagePlus, X } from 'lucide-react'
import skLogo from '../assets/sk-logo.svg'

const CATEGORIES = ['Health', 'Sports', 'Livelihood', 'Environment', 'Culture']

export function SKPortal({ onBack }) {
  const { userRole, setUserRole, selectedBarangay, selectedCity, selectedProvince, selectedRegion, addProgram } = useAppStore()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [form, setForm] = useState({ name: '', category: 'Health', budget: '', date: '', description: '' })
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const addressComplete = selectedBarangay && selectedCity && selectedProvince && selectedRegion

  const handlePhoto = e => {
    const file = e.target.files[0]; if (!file) return
    setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (userRole !== 'sk-official') return
    if (!addressComplete) { toast.error('Pumili muna ng buong address (Rehiyon hanggang Barangay).'); return }
    setSubmitting(true)
    try {
      let photoUrl = null
      if (photoFile) photoUrl = await uploadPhoto(photoFile)
      const program = await createProgram({
        ...form,
        budget: parseInt(form.budget),
        barangayId: selectedBarangay.code,
        barangayName: selectedBarangay.name,
        cityName: selectedCity.name,
        provinceName: selectedProvince.name,
        regionName: selectedRegion.name,
        photoUrl,
      })
      addProgram(program)
      setSubmitted(true)
    } catch { toast.error('Hindi na-submit. Subukan ulit.') }
    finally { setSubmitting(false) }
  }

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="surface pop-in" style={{ maxWidth: 380, width: '100%', padding: 36, textAlign: 'center' }}>
        <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--blue-pale)', border: '2px solid var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={30} style={{ color: 'var(--blue)' }} />
        </div>
        <h2 className="heading" style={{ fontSize: 24, color: 'var(--gray-900)', marginBottom: 10 }}>Naisumite Na!</h2>
        <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.7, marginBottom: 24 }}>
          Ang iyong programa ay naidagdag na sa public dashboard bilang{' '}
          <span style={{ color: '#92400e', fontWeight: 600 }}>Pending Verification</span>.
          Maaari na itong makita ng mga KK member.
        </p>
        <button onClick={onBack} className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: 15, justifyContent: 'center' }}>
          Bumalik sa Dashboard
        </button>
      </div>
    </div>
  )

  const fieldLabel = (text, required) => (
    <label className="input-label">{text}{required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}</label>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>

      {/* Header */}
      <header style={{ background: 'var(--blue)', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 16px rgba(0,56,168,0.25)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--yellow) 60%, var(--red) 60%)' }} />
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={onBack} className="btn btn-ghost" style={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', padding: '6px 12px', fontSize: 13 }}>
              <ArrowLeft size={14} /> <span className="hidden-mobile">Bumalik</span>
            </button>
            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)' }} />
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: 'white', display: 'flex', alignItems: 'center', gap: 7 }}>
              <img src={skLogo} alt="SK" style={{ width: 28, height: 28, borderRadius: 7, objectFit: 'contain', background: 'white', padding: 3, flexShrink: 0 }} />
              <span className="hidden-mobile">SK Official Portal</span>
              <span className="show-mobile" style={{ fontSize: 13 }}>SK Portal</span>
            </span>
          </div>
          <select value={userRole} onChange={e => setUserRole(e.target.value)} style={{
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600,
            padding: '6px 10px', outline: 'none', cursor: 'pointer',
          }}>
            <option value="public"      style={{ background: 'white', color: '#151929' }}>○ Bisita</option>
            <option value="kk-member"   style={{ background: 'white', color: '#151929' }}>◐ KK Member</option>
            <option value="sk-official" style={{ background: 'white', color: '#151929' }}>● SK Official</option>
          </select>
        </div>
      </header>

      {userRole !== 'sk-official' && (
        <div style={{ background: 'var(--yellow-light)', borderBottom: '1px solid #fde68a', padding: '9px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, flexWrap: 'wrap' }}>
          ⚠ Para makapag-sumite ng programa, palitan ang role sa <strong>SK Official</strong>
        </div>
      )}

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div className="slide-up">
          <p className="label-caps" style={{ marginBottom: 4 }}>SK Official Portal</p>
          <h1 className="heading" style={{ fontSize: 26, color: 'var(--gray-900)' }}>Isumite ang Programa</h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)', marginTop: 6 }}>
            Punan ang form para idagdag ang programa sa public dashboard ng barangay.
          </p>
        </div>

        {/* Address selector */}
        <AddressSelector />

        {!addressComplete && (
          <p style={{ fontSize: 12, color: 'var(--gray-400)', textAlign: 'center', marginTop: -8 }}>
            ☝ Kumpletuhin ang address selector bago mag-submit.
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Program info */}
          <div className="surface slide-up d1" style={{ padding: 20 }}>
            <p className="label-caps" style={{ marginBottom: 18 }}>Impormasyon ng Programa</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                {fieldLabel('Pangalan ng Programa', true)}
                <input className="input" required placeholder="hal. Kabataan Health Caravan 2026"
                  value={form.name} onChange={e => f('name', e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  {fieldLabel('Kategorya', true)}
                  <select className="input" required value={form.category} onChange={e => f('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  {fieldLabel('Pondo (₱)', true)}
                  <input className="input" type="number" required min="1" placeholder="45000"
                    value={form.budget} onChange={e => f('budget', e.target.value)} />
                </div>
              </div>

              <div>
                {fieldLabel('Petsa ng Programa', true)}
                <input className="input" type="date" required value={form.date} onChange={e => f('date', e.target.value)} />
              </div>

              <div>
                {fieldLabel('Paglalarawan', true)}
                <textarea className="input" required rows={4} style={{ resize: 'none' }}
                  placeholder="Ilarawan ang programa: sino ang nakikinabang, ano ang naisakatuparan, at kung paano ginastos ang pondo..."
                  value={form.description} onChange={e => f('description', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Photo */}
          <div className="surface slide-up d2" style={{ padding: 20 }}>
            <p className="label-caps" style={{ marginBottom: 14 }}>Larawan / Katibayan</p>
            {photoPreview ? (
              <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <img src={photoPreview} alt="preview" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                  style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed var(--gray-200)', borderRadius: 'var(--radius)', padding: '32px 24px',
                cursor: 'pointer', transition: 'all 0.15s', background: 'var(--gray-50)',
              }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'var(--blue-pale)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'var(--gray-50)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--blue-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <ImagePlus size={20} style={{ color: 'var(--blue)' }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 4 }}>I-upload ang larawan ng programa</span>
                <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>PNG, JPG hanggang 10MB</span>
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          <button type="submit"
            disabled={userRole !== 'sk-official' || submitting || !addressComplete}
            className="btn btn-primary slide-up d3"
            style={{ width: '100%', padding: '14px', fontSize: 15, justifyContent: 'center' }}>
            {submitting
              ? <><Loader2 size={16} className="spin" /> Isinusumite...</>
              : <><Upload size={16} /> Isumite ang Programa</>
            }
          </button>

          {userRole !== 'sk-official' && (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--gray-400)' }}>
              Palitan ang iyong role sa <strong>SK Official</strong> para ma-enable ang submit button.
            </p>
          )}
        </form>
      </main>
    </div>
  )
}