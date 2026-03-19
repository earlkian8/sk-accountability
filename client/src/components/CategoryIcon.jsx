const cfg = {
  Health:      { emoji: '🏥', bg: '#eff6ff', color: '#1d4ed8' },
  Sports:      { emoji: '⚽', bg: '#fff7ed', color: '#c2410c' },
  Livelihood:  { emoji: '💼', bg: '#faf5ff', color: '#7c3aed' },
  Environment: { emoji: '🌿', bg: '#f0fdf4', color: '#15803d' },
  Culture:     { emoji: '🎭', bg: '#fdf4ff', color: '#a21caf' },
}

export function CategoryTag({ category }) {
  const { emoji, bg, color } = cfg[category] || { emoji: '📌', bg: '#f8f9fc', color: '#6b7591' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: bg, color, border: `1px solid ${color}22`,
      borderRadius: 99, padding: '4px 10px',
      fontSize: 12, fontWeight: 600,
    }}>
      {emoji} {category}
    </span>
  )
}