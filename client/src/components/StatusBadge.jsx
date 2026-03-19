export function StatusBadge({ status }) {
  const cfg = {
    verified: { label: 'Verified',  cls: 'badge-verified', icon: '✓' },
    pending:  { label: 'Pending',   cls: 'badge-pending',  icon: '◷' },
    flagged:  { label: 'Flagged',   cls: 'badge-flagged',  icon: '!' },
  }
  const { label, cls, icon } = cfg[status] || cfg.pending
  return <span className={`badge ${cls}`}>{icon} {label}</span>
}