import { StatusBadge } from './StatusBadge'
import { CategoryTag }  from './CategoryIcon'
import { CheckCircle2, Flag, Calendar } from 'lucide-react'

export function ProgramCard({ program, onClick }) {
  return (
    <div onClick={onClick} className="surface surface-hover" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
        <StatusBadge status={program.status} />
        <CategoryTag  category={program.category} />
      </div>

      {/* Title */}
      <h3 className="heading" style={{
        fontSize: 17, color: 'var(--gray-900)', marginBottom: 8, lineHeight: 1.3,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {program.name}
      </h3>

      {/* Description */}
      <p style={{
        fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.65, marginBottom: 16, flexGrow: 1,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {program.description}
      </p>

      {/* Date */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--gray-400)', marginBottom: 14 }}>
        <Calendar size={12} />
        {new Date(program.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 14, borderTop: '1px solid var(--gray-100)',
      }}>
        <span className="heading" style={{ fontSize: 18, color: 'var(--blue)' }}>
          ₱{Number(program.budget).toLocaleString()}
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>
            <CheckCircle2 size={13} /> {program.verifications}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--red)' }}>
            <Flag size={13} /> {program.flags}
          </span>
        </div>
      </div>
    </div>
  )
}