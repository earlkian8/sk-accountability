export function BudgetBar({ allocated, reported, verified }) {
  const rPct = Math.min((reported  / allocated) * 100, 100)
  const vPct = Math.min((verified  / allocated) * 100, 100)
  const fmt  = n => `₱${Number(n).toLocaleString()}`
  const remaining = Math.max(allocated - reported, 0)

  return (
    <div className="surface slide-up" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p className="label-caps" style={{ marginBottom: 4 }}>Annual Budget</p>
          <p className="display" style={{ fontSize: 28, color: 'var(--blue)' }}>
            {fmt(allocated)}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="label-caps" style={{ marginBottom: 4 }}>Reported</p>
          <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Syne', color: 'var(--gray-900)' }}>
            {rPct.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Stacked bar */}
      <div style={{ position: 'relative', height: 10, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${rPct}%`, background: 'var(--blue-light)',
          borderRadius: 99, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
        }} />
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${vPct}%`, background: 'var(--blue)',
          borderRadius: 99, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {[
          { dot: 'var(--blue)',       label: 'Community Verified', val: fmt(verified) },
          { dot: 'var(--blue-light)', label: 'Reported',           val: fmt(reported),  border: '1px solid var(--blue)' },
          { dot: 'var(--gray-200)',   label: 'Unreported',         val: fmt(remaining), border: '1px solid var(--gray-300)' },
        ].map(({ dot, label, val, border }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: dot, border, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{label}:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-700)' }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}