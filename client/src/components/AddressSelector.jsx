import { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { MapPin, ChevronRight, Loader2 } from 'lucide-react'

/**
 * Cascading Philippine address selector:
 * Region → Province → City/Municipality → Barangay
 */
export function AddressSelector() {
  const {
    regions, provinces, cities, barangays,
    selectedRegion, selectedProvince, selectedCity, selectedBarangay,
    loadRegions, selectRegion, selectProvince, selectCity, selectBarangay,
    loadingAddress,
  } = useAppStore()

  useEffect(() => { loadRegions() }, [])

  const selectStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '2px solid var(--gray-200)',
    background: 'white',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--gray-700)',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: 36,
    transition: 'border-color 0.15s',
  }

  const activeBorder = { borderColor: 'var(--blue)', boxShadow: '0 0 0 3px rgba(0,56,168,0.1)' }

  return (
    <div className="surface slide-up" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <MapPin size={15} style={{ color: 'var(--blue)', flexShrink: 0 }} />
        <p className="label-caps" style={{ marginBottom: 0 }}>Piliin ang Lokasyon</p>
        {loadingAddress && <Loader2 size={13} style={{ color: 'var(--blue)', marginLeft: 4 }} className="spin" />}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10,
      }}>
        {/* Region */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Rehiyon</label>
          <select
            style={{ ...selectStyle, ...(selectedRegion ? activeBorder : {}) }}
            value={selectedRegion?.code || ''}
            onChange={e => {
              const r = regions.find(x => x.code === e.target.value)
              if (r) selectRegion(r)
            }}
          >
            <option value="">— Pumili ng Rehiyon —</option>
            {regions.map(r => (
              <option key={r.code} value={r.code}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Province */}
        <div style={{ opacity: selectedRegion ? 1 : 0.45, transition: 'opacity 0.2s' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Lalawigan</label>
          <select
            style={{ ...selectStyle, ...(selectedProvince ? activeBorder : {}) }}
            value={selectedProvince?.code || ''}
            disabled={!selectedRegion || provinces.length === 0}
            onChange={e => {
              const p = provinces.find(x => x.code === e.target.value)
              if (p) selectProvince(p)
            }}
          >
            <option value="">— Pumili ng Lalawigan —</option>
            {provinces.map(p => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* City/Municipality */}
        <div style={{ opacity: selectedProvince ? 1 : 0.45, transition: 'opacity 0.2s' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Lungsod / Bayan</label>
          <select
            style={{ ...selectStyle, ...(selectedCity ? activeBorder : {}) }}
            value={selectedCity?.code || ''}
            disabled={!selectedProvince || cities.length === 0}
            onChange={e => {
              const c = cities.find(x => x.code === e.target.value)
              if (c) selectCity(c)
            }}
          >
            <option value="">— Pumili ng Lungsod/Bayan —</option>
            {cities.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Barangay */}
        <div style={{ opacity: selectedCity ? 1 : 0.45, transition: 'opacity 0.2s' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Barangay</label>
          <select
            style={{ ...selectStyle, ...(selectedBarangay ? activeBorder : {}) }}
            value={selectedBarangay?.code || ''}
            disabled={!selectedCity || barangays.length === 0}
            onChange={e => {
              const b = barangays.find(x => x.code === e.target.value)
              if (b) selectBarangay(b)
            }}
          >
            <option value="">— Pumili ng Barangay —</option>
            {barangays.map(b => (
              <option key={b.code} value={b.code}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Breadcrumb trail */}
      {selectedBarangay && (
        <div style={{
          marginTop: 14, padding: '8px 12px',
          background: 'var(--blue-pale)', borderRadius: 8,
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4,
          fontSize: 12, fontWeight: 600, color: 'var(--blue)',
        }}>
          <span>{selectedRegion?.name}</span>
          <ChevronRight size={11} style={{ opacity: 0.5 }} />
          <span>{selectedProvince?.name}</span>
          <ChevronRight size={11} style={{ opacity: 0.5 }} />
          <span>{selectedCity?.name}</span>
          <ChevronRight size={11} style={{ opacity: 0.5 }} />
          <span style={{ background: 'var(--blue)', color: 'white', padding: '2px 8px', borderRadius: 99 }}>
            Brgy. {selectedBarangay?.name}
          </span>
        </div>
      )}
    </div>
  )
}