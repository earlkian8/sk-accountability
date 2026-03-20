/**
 * src/components/AddressSelector.jsx
 */

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { MapPin, ChevronRight, Loader2, LocateFixed, AlertCircle, PencilLine } from 'lucide-react'

function normalize(str = '') {
  return str
    .toLowerCase()
    .replace(/\b(city|municipality|barangay|brgy\.?|mun\.?|of|the)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function fuzzyFind(list, targetName) {
  if (!list?.length || !targetName) return null
  const target = normalize(targetName)
  if (!target) return null

  let match = list.find(item => normalize(item.name) === target)
  if (match) return match

  match = list.find(item => {
    const n = normalize(item.name)
    return n.includes(target) || target.includes(n)
  })
  if (match) return match

  const targetFirst = target.split(' ')[0]
  if (targetFirst.length >= 4) {
    match = list.find(item => normalize(item.name).startsWith(targetFirst))
    if (match) return match
  }

  const targetWords = target.split(' ').filter(w => w.length >= 4)
  match = list.find(item => {
    const itemWords = normalize(item.name).split(' ')
    return targetWords.some(tw => itemWords.some(iw => iw === tw))
  })
  return match || null
}

function parseDisplayName(displayName = '') {
  const cleaned = displayName.replace(/,?\s*Philippines\s*$/i, '').trim()
  const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean).reverse()
  return {
    regionHint:   parts[0] || '',
    provinceHint: parts[1] || '',
    cityHint:     parts[2] || '',
    barangayHint: parts[3] || '',
  }
}

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
  const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'SKCheck/1.0' } })
  if (!res.ok) throw new Error('Nominatim request failed')
  const data = await res.json()
  const addr = data.address || {}
  const fromDisplay = parseDisplayName(data.display_name || '')

  console.log('[SKCheck] Nominatim raw:', JSON.stringify(addr, null, 2))

  return {
    region:   addr.region   || addr.state         || fromDisplay.regionHint,
    province: addr.province || addr.county        || addr.state_district || fromDisplay.provinceHint,
    city:     addr.city     || addr.town          || addr.municipality   || addr.village || fromDisplay.cityHint,
    barangay: addr.suburb   || addr.neighbourhood || addr.quarter        || addr.hamlet  || fromDisplay.barangayHint,
    addrState: addr.state   || '',
    fromDisplay,
  }
}

async function findCityUnderRegion(regionCode, candidates) {
  const res = await fetch(`https://psgc.cloud/api/regions/${regionCode}/cities-municipalities`)
  if (!res.ok) return null
  const cityList = await res.json()
  if (!cityList?.length) return null
  for (const candidate of candidates) {
    const match = fuzzyFind(cityList, candidate)
    if (match) return match
  }
  return null
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────
export function AddressSelector() {
  const {
    regions, provinces, cities, barangays,
    selectedRegion, selectedProvince, selectedCity, selectedBarangay,
    loadRegions, selectRegion, selectProvince, selectCity, selectBarangay,
    loadingAddress,
  } = useAppStore()

  const [geoStatus, setGeoStatus] = useState('idle') // idle | locating | geocoding | matching | done | error
  const [geoError, setGeoError]   = useState(null)
  // After auto-detect, show a "Wrong location?" nudge so user can correct
  const [showCorrection, setShowCorrection] = useState(false)

  const autoDetect = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoStatus('error')
      setGeoError('Hindi sinusuportahan ng browser ang geolocation.')
      return
    }

    setGeoStatus('locating')
    setGeoError(null)
    setShowCorrection(false)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setGeoStatus('geocoding')
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          const { region: rName, province: pName, city: cName, barangay: bName, addrState, fromDisplay } = await reverseGeocode(lat, lng)

          setGeoStatus('matching')

          let currentRegions = regions
          if (!currentRegions.length) {
            await loadRegions()
            const r = await fetch('https://psgc.cloud/api/regions')
            currentRegions = await r.json()
          }

          // ── Region ───────────────────────────────────
          const regionCandidates = [rName, addrState, fromDisplay.regionHint, fromDisplay.provinceHint].filter(Boolean)
          let matchedRegion = null
          for (const c of regionCandidates) {
            matchedRegion = fuzzyFind(currentRegions, c)
            if (matchedRegion) break
          }
          if (!matchedRegion) throw new Error(`Hindi ma-match ang rehiyon (${regionCandidates.join(' | ')}). Pumili ng manu-mano.`)
          await selectRegion(matchedRegion)

          // ── Province ─────────────────────────────────
          const provRes  = await fetch(`https://psgc.cloud/api/regions/${matchedRegion.code}/provinces`)
          const provList = await provRes.json()

          const provCandidates = [pName, fromDisplay.provinceHint, fromDisplay.cityHint, cName].filter(Boolean)
          let matchedProvince = null
          for (const c of provCandidates) {
            matchedProvince = fuzzyFind(provList, c)
            if (matchedProvince) break
          }

          let matchedCity = null

          if (matchedProvince) {
            await selectProvince(matchedProvince)
            const cityRes  = await fetch(`https://psgc.cloud/api/provinces/${matchedProvince.code}/cities-municipalities`)
            const cityList = await cityRes.json()
            const cityCandidates = [cName, fromDisplay.cityHint, bName, fromDisplay.barangayHint, pName].filter(Boolean)
            for (const c of cityCandidates) {
              matchedCity = fuzzyFind(cityList, c)
              if (matchedCity) break
            }
          }

          // ── HUC fallback (city directly under region) ─
          if (!matchedCity) {
            const cityCandidates = [cName, fromDisplay.cityHint, pName, fromDisplay.provinceHint].filter(Boolean)
            matchedCity = await findCityUnderRegion(matchedRegion.code, cityCandidates)
          }

          if (!matchedCity) {
            const tried = [cName, pName, fromDisplay.cityHint, fromDisplay.provinceHint].filter(Boolean)
            throw new Error(`Hindi ma-match ang lungsod/bayan (${tried.join(' | ')}). Pumili ng manu-mano.`)
          }

          await selectCity(matchedCity)

          // ── Barangay (best-effort) ────────────────────
          const brgyRes  = await fetch(`https://psgc.cloud/api/cities-municipalities/${matchedCity.code}/barangays`)
          const brgyList = await brgyRes.json()
          const brgyCandidates = [bName, fromDisplay.barangayHint].filter(Boolean)
          for (const c of brgyCandidates) {
            const match = fuzzyFind(brgyList, c)
            if (match) { await selectBarangay(match); break }
          }

          setGeoStatus('done')
          // Show the correction nudge after a short delay
          setTimeout(() => setShowCorrection(true), 800)

        } catch (err) {
          console.error('[SKCheck] autoDetect error:', err)
          setGeoStatus('error')
          setGeoError(err.message || 'Hindi ma-detect ang iyong lokasyon.')
        }
      },
      (err) => {
        setGeoStatus('error')
        setGeoError(
          err.code === 1 ? 'Na-deny ang location permission. Pumili ng manu-mano.'
          : err.code === 2 ? 'Hindi available ang location. Pumili ng manu-mano.'
          : 'Nag-timeout ang location. Pumili ng manu-mano.'
        )
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }, [regions, loadRegions, selectRegion, selectProvince, selectCity, selectBarangay])

  useEffect(() => {
    loadRegions()
    autoDetect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Hide correction nudge once user manually changes anything
  const handleRegionChange = (e) => {
    setShowCorrection(false)
    setGeoStatus('idle')
    const r = regions.find(x => x.code === e.target.value)
    if (r) selectRegion(r)
  }
  const handleProvinceChange = (e) => {
    setShowCorrection(false)
    setGeoStatus('idle')
    const p = provinces.find(x => x.code === e.target.value)
    if (p) selectProvince(p)
  }
  const handleCityChange = (e) => {
    setShowCorrection(false)
    setGeoStatus('idle')
    const c = cities.find(x => x.code === e.target.value)
    if (c) selectCity(c)
  }
  const handleBarangayChange = (e) => {
    setShowCorrection(false)
    const b = barangays.find(x => x.code === e.target.value)
    if (b) selectBarangay(b)
  }

  const selectStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '2px solid var(--gray-200)', background: 'white',
    fontSize: 14, fontWeight: 500, color: 'var(--gray-700)',
    outline: 'none', cursor: 'pointer', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
    paddingRight: 36, transition: 'border-color 0.15s',
  }
  const activeBorder = { borderColor: 'var(--blue)', boxShadow: '0 0 0 3px rgba(0,56,168,0.1)' }

  const isLocating = ['locating', 'geocoding', 'matching'].includes(geoStatus)
  const statusLabel = {
    locating:  'Kinukuha ang lokasyon...',
    geocoding: 'Binabasa ang address...',
    matching:  'Hinahanap ang barangay...',
  }[geoStatus] || ''

  return (
    <div className="surface slide-up" style={{ padding: 20 }}>

      {/* ── Header ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={15} style={{ color: 'var(--blue)', flexShrink: 0 }} />
          <p className="label-caps" style={{ marginBottom: 0 }}>Piliin ang Lokasyon</p>
          {(loadingAddress || isLocating) && <Loader2 size={13} style={{ color: 'var(--blue)' }} className="spin" />}
        </div>

        <button
          onClick={autoDetect}
          disabled={isLocating || loadingAddress}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 8,
            border: '1px solid var(--blue-light)',
            background: 'var(--blue-pale)', color: 'var(--blue)',
            fontSize: 12, fontWeight: 600,
            cursor: isLocating ? 'default' : 'pointer',
            opacity: isLocating ? 0.6 : 1, transition: 'all 0.15s',
          }}
          onMouseOver={e => { if (!isLocating) e.currentTarget.style.background = 'var(--blue-light)' }}
          onMouseOut={e => { e.currentTarget.style.background = 'var(--blue-pale)' }}
        >
          {isLocating ? <Loader2 size={12} className="spin" /> : <LocateFixed size={12} />}
          {isLocating ? statusLabel : geoStatus === 'done' ? 'Re-detect' : 'I-detect ang Lokasyon'}
        </button>
      </div>

      {/* ── GPS inaccuracy correction nudge ─────────── */}
      {showCorrection && geoStatus === 'done' && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 8, padding: '8px 12px', marginBottom: 14,
          animation: 'fadeIn 0.3s ease',
        }}>
          <PencilLine size={13} style={{ color: '#92400e', flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5, flex: 1 }}>
            <strong>Mali ang lokasyon?</strong> Ang GPS ay minsan hindi tumpak. Baguhin ang mga dropdown sa ibaba.
          </p>
          <button
            onClick={() => setShowCorrection(false)}
            style={{ fontSize: 11, color: '#92400e', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, padding: 0, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Error banner ────────────────────────────── */}
      {geoStatus === 'error' && geoError && (
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-start',
          background: '#fff7ed', border: '1px solid #fed7aa',
          borderRadius: 8, padding: '9px 12px', marginBottom: 14,
        }}>
          <AlertCircle size={14} style={{ color: '#f97316', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: '#9a3412', lineHeight: 1.5 }}>{geoError}</p>
        </div>
      )}

      {/* ── Selects ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>

        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Rehiyon</label>
          <select style={{ ...selectStyle, ...(selectedRegion ? activeBorder : {}) }}
            value={selectedRegion?.code || ''} onChange={handleRegionChange}>
            <option value="">— Pumili ng Rehiyon —</option>
            {regions.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
          </select>
        </div>

        <div style={{ opacity: selectedRegion ? 1 : 0.45, transition: 'opacity 0.2s' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Lalawigan</label>
          <select style={{ ...selectStyle, ...(selectedProvince ? activeBorder : {}) }}
            value={selectedProvince?.code || ''}
            disabled={!selectedRegion || provinces.length === 0}
            onChange={handleProvinceChange}>
            <option value="">— Pumili ng Lalawigan —</option>
            {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
        </div>

        <div style={{ opacity: selectedProvince ? 1 : 0.45, transition: 'opacity 0.2s' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Lungsod / Bayan</label>
          <select style={{ ...selectStyle, ...(selectedCity ? activeBorder : {}) }}
            value={selectedCity?.code || ''}
            disabled={!selectedProvince || cities.length === 0}
            onChange={handleCityChange}>
            <option value="">— Pumili ng Lungsod/Bayan —</option>
            {cities.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>

        <div style={{ opacity: selectedCity ? 1 : 0.45, transition: 'opacity 0.2s' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Barangay</label>
          <select style={{ ...selectStyle, ...(selectedBarangay ? activeBorder : {}) }}
            value={selectedBarangay?.code || ''}
            disabled={!selectedCity || barangays.length === 0}
            onChange={handleBarangayChange}>
            <option value="">— Pumili ng Barangay —</option>
            {barangays.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* ── Breadcrumb ──────────────────────────────── */}
      {(selectedCity || selectedBarangay) && (
        <div style={{
          marginTop: 14, padding: '8px 12px',
          background: 'var(--blue-pale)', borderRadius: 8,
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4,
          fontSize: 12, fontWeight: 600, color: 'var(--blue)',
        }}>
          {geoStatus === 'done' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 4, color: 'var(--green)', fontSize: 11 }}>
              <LocateFixed size={10} /> Auto-detected ·
            </span>
          )}
          {selectedRegion && <span>{selectedRegion.name}</span>}
          {selectedProvince && <><ChevronRight size={11} style={{ opacity: 0.5 }} /><span>{selectedProvince.name}</span></>}
          {selectedCity && <><ChevronRight size={11} style={{ opacity: 0.5 }} /><span>{selectedCity.name}</span></>}
          {selectedBarangay && (
            <><ChevronRight size={11} style={{ opacity: 0.5 }} />
            <span style={{ background: 'var(--blue)', color: 'white', padding: '2px 8px', borderRadius: 99 }}>
              Brgy. {selectedBarangay.name}
            </span></>
          )}
        </div>
      )}

      {/* City detected but barangay not auto-matched */}
      {geoStatus === 'done' && selectedCity && !selectedBarangay && (
        <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
          <AlertCircle size={11} />
          Nahanap ang lungsod/bayan. Mangyaring piliin ang iyong barangay sa itaas.
        </p>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}