import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { BudgetBar }   from '../components/BudgetBar'
import { ProgramCard } from '../components/ProgramCard'
import { AlertTriangle, Loader2, Plus, Shield, Users, Eye } from 'lucide-react'
import skLogo from '../assets/sk-logo.svg'
const ROLES = [
  { value: 'public',      label: 'Bisita',      icon: Eye,    desc: 'View only' },
  { value: 'kk-member',   label: 'KK Member',   icon: Users,  desc: 'Can verify & flag' },
  { value: 'sk-official', label: 'SK Official', icon: Shield, desc: 'Can submit programs' },
]

export function Dashboard({ onProgramClick, onGoToPortal }) {
  const { barangays, programs, selectedBarangayId, setSelectedBarangayId, loadBarangays, userRole, setUserRole, loading } = useAppStore()

  useEffect(() => { loadBarangays() }, [])

  const barangay = barangays.find(b => b.id === selectedBarangayId)
  const reported  = programs.reduce((s, p) => s + Number(p.budget), 0)
  const verified  = programs.filter(p => p.status === 'verified').reduce((s, p) => s + Number(p.budget), 0)
  const counts    = {
    total:    programs.length,
    verified: programs.filter(p => p.status === 'verified').length,
    pending:  programs.filter(p => p.status === 'pending').length,
    flagged:  programs.filter(p => p.status === 'flagged').length,
  }

  const currentRole = ROLES.find(r => r.value === userRole)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header style={{
        background: 'var(--blue)',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 2px 16px rgba(0,56,168,0.25)',
      }}>
        {/* Thin yellow stripe on top */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--yellow) 0%, var(--yellow) 60%, var(--red) 60%, var(--red) 100%)' }} />

        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
                src={skLogo}
                alt="Sangguniang Kabataan"
                style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'contain', background: 'white', padding: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: 'white', lineHeight: 1, letterSpacing: '-0.02em' }}>SKCheck</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 500, marginTop: 1 }}>Sangguniang Kabataan Accountability</div>
            </div>
          </div>

          {/* Role selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'flex', background: 'rgba(255,255,255,0.1)',
              borderRadius: 10, padding: 3, gap: 2,
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              {ROLES.map(r => {
                const Icon = r.icon
                const active = userRole === r.value
                return (
                  <button key={r.value} onClick={() => setUserRole(r.value)} style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                    background: active ? 'white' : 'transparent',
                    color:      active ? 'var(--blue)' : 'rgba(255,255,255,0.7)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                  }}>
                    <Icon size={13} />
                    <span className="hidden-mobile">{r.label}</span>
                  </button>
                )
              })}
            </div>

            {userRole === 'sk-official' && (
              <button onClick={onGoToPortal} className="btn" style={{
                background: 'var(--yellow)', color: 'var(--blue-dark)',
                padding: '8px 16px', fontWeight: 700, fontSize: 13,
                boxShadow: '0 2px 8px rgba(252,209,22,0.4)',
              }}>
                <Plus size={14} /> Magdagdag
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── ROLE CONTEXT BANNER ─────────────────────────────── */}
      {userRole !== 'public' && (
        <div style={{
          background: userRole === 'kk-member' ? '#fffbeb' : '#eff6ff',
          borderBottom: `1px solid ${userRole === 'kk-member' ? '#fde68a' : 'var(--blue-light)'}`,
          padding: '9px 24px', textAlign: 'center',
          fontSize: 13, fontWeight: 600,
          color: userRole === 'kk-member' ? '#92400e' : 'var(--blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {userRole === 'kk-member'
            ? <><Users size={14} /> KK Member — Maaari kang mag-verify o mag-flag ng mga programa</>
            : <><Shield size={14} /> SK Official — Maaari kang magsumite ng mga programa sa barangay</>
          }
        </div>
      )}

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── BARANGAY SELECTOR ──────────────────────────────── */}
        {barangays.length > 0 && (
          <section className="slide-up">
            <p className="label-caps" style={{ marginBottom: 10 }}>Piliin ang Barangay</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {barangays.map(b => {
                const active = selectedBarangayId === b.id
                return (
                  <button key={b.id} onClick={() => setSelectedBarangayId(b.id)} style={{
                    padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
                    fontSize: 14, fontWeight: 600, transition: 'all 0.15s',
                    border: `2px solid ${active ? 'var(--blue)' : 'var(--gray-200)'}`,
                    background: active ? 'var(--blue)' : 'white',
                    color:      active ? 'white' : 'var(--gray-700)',
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: active ? '0 4px 12px rgba(0,56,168,0.25)' : 'var(--shadow-sm)',
                    transform: active ? 'translateY(-1px)' : 'none',
                  }}>
                    Brgy. {b.name}
                    {b.isDormant && <span className="badge badge-dormant" style={{ fontSize: 11, padding: '2px 8px' }}>Dormant</span>}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* ── DORMANT ALERT ──────────────────────────────────── */}
        {barangay?.isDormant && (
          <div className="slide-up" style={{
            background: 'var(--orange-light)', border: '1px solid #fed7aa',
            borderRadius: 'var(--radius-lg)', padding: '16px 20px',
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle size={18} style={{ color: 'var(--orange)' }} />
            </div>
            <div>
              <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: '#7c2d12', marginBottom: 4 }}>
                Walang Aktibidad — Brgy. {barangay.name}
              </p>
              <p style={{ fontSize: 13, color: '#9a3412', lineHeight: 1.65 }}>
                Walang nai-report na programa sa nakalipas na <strong>8 buwan</strong>. Hindi nakikita ang paggamit ng ₱{Number(barangay.annualBudget || 0).toLocaleString()} na pondo. Makipag-ugnayan sa inyong lokal na DILG o BLGU para sa karagdagang impormasyon.
              </p>
            </div>
          </div>
        )}

        {/* ── STATS + BUDGET ──────────────────────────────────── */}
        {barangay && !barangay.isDormant && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
            <BudgetBar allocated={barangay.annualBudget || 180000} reported={reported} verified={verified} />

            {/* Stat pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 120 }}>
              {[
                { label: 'Verified', val: counts.verified, color: 'var(--green)',  bg: 'var(--green-light)',  border: '#bbf7d0' },
                { label: 'Pending',  val: counts.pending,  color: '#92400e',        bg: 'var(--yellow-light)', border: '#fde68a' },
                { label: 'Flagged',  val: counts.flagged,  color: 'var(--red)',     bg: 'var(--red-light)',    border: '#fecaca' },
              ].map(s => (
                <div key={s.label} style={{
                  background: s.bg, border: `1px solid ${s.border}`,
                  borderRadius: 'var(--radius)', padding: '10px 16px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}>
                  <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, color: s.color, lineHeight: 1 }}>{s.val}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: s.color, opacity: 0.7, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROGRAMS HEADER ────────────────────────────────── */}
        {barangay && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }} className="slide-up d2">
            <div>
              <p className="label-caps" style={{ marginBottom: 4 }}>Mga Programa</p>
              <h2 className="heading" style={{ fontSize: 24, color: 'var(--gray-900)' }}>
                Brgy. {barangay.name}
              </h2>
            </div>
            <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 600 }}>
              {counts.total} programa
            </span>
          </div>
        )}

        {/* ── LOADING ────────────────────────────────────────── */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <Loader2 size={28} style={{ color: 'var(--blue)' }} className="spin" />
              <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500 }}>Naglo-load ng mga programa...</span>
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ────────────────────────────────────── */}
        {!loading && barangay && programs.length === 0 && (
          <div className="surface slide-up" style={{ textAlign: 'center', padding: '56px 24px' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--blue-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span style={{ fontSize: 24 }}>📭</span>
            </div>
            <p className="heading" style={{ fontSize: 18, color: 'var(--gray-700)', marginBottom: 6 }}>Walang Programa</p>
            <p style={{ fontSize: 13, color: 'var(--gray-400)', maxWidth: 300, margin: '0 auto' }}>
              Ang SK ng Brgy. {barangay.name} ay walang nai-report na programa pa.
            </p>
          </div>
        )}

        {/* ── PROGRAMS GRID ──────────────────────────────────── */}
        {!loading && programs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }}>
            {programs.map((p, i) => (
              <div key={p.id} className={`slide-up d${Math.min(i + 1, 5)}`}>
                <ProgramCard program={p} onClick={() => onProgramClick(p)} />
              </div>
            ))}
          </div>
        )}

      </main>

      <footer style={{ borderTop: '1px solid var(--gray-200)', marginTop: 40, padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 500 }}>
          SKCheck — Para sa Kabataan, Ng Kabataan, Dahil sa Kabataan &nbsp;🇵🇭
        </p>
      </footer>
    </div>
  )
}