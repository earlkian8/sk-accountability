/**
 * src/components/CredibilityCard.jsx
 * KK Member credibility analysis result display
 * Rendered inside ProgramDetail after AI analysis completes
 */

import { Sparkles, Shield, AlertTriangle, XCircle, CheckCircle2, Loader2 } from 'lucide-react'

// ── Score ring SVG ───────────────────────────────────────────
function ScoreRing({ score, color }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  const colorMap = {
    green:  { stroke: '#22c55e', bg: '#f0fdf4', text: '#15803d' },
    yellow: { stroke: '#eab308', bg: '#fefce8', text: '#a16207' },
    orange: { stroke: '#f97316', bg: '#fff7ed', text: '#c2410c' },
    red:    { stroke: '#ef4444', bg: '#fef2f2', text: '#b91c1c' },
  }
  const c = colorMap[color] || colorMap.yellow

  return (
    <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
      <svg width={96} height={96} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={48} cy={48} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={7} />
        <circle
          cx={48} cy={48} r={radius}
          fill="none"
          stroke={c.stroke}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: c.text, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, fontWeight: 600, color: c.text, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>/ 100</span>
      </div>
    </div>
  )
}

// ── Verdict icon ─────────────────────────────────────────────
function VerdictIcon({ verdict }) {
  if (verdict === 'Highly Credible' || verdict === 'Credible') {
    return <CheckCircle2 size={15} style={{ color: '#22c55e' }} />
  }
  if (verdict === 'Questionable') {
    return <AlertTriangle size={15} style={{ color: '#f97316' }} />
  }
  return <XCircle size={15} style={{ color: '#ef4444' }} />
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export function CredibilityCard({ result, isLoading, streamBuffer, onAnalyze, canAnalyze }) {
  const colorMap = {
    green:  { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', label: '#22c55e' },
    yellow: { bg: '#fefce8', border: '#fde68a', text: '#a16207', label: '#eab308' },
    orange: { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', label: '#f97316' },
    red:    { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', label: '#ef4444' },
  }
  const colors = result ? (colorMap[result.verdict_color] || colorMap.yellow) : null

  const sentimentColor = {
    'Positive': '#22c55e',
    'Mixed': '#f97316',
    'Negative': '#ef4444',
    'No Data': '#9ca3af',
  }

  return (
    <div className="surface slide-up d3" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #0038a8, #ce1126)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={13} style={{ color: '#fcd116' }} />
          </div>
          <p className="label-caps" style={{ marginBottom: 0 }}>AI Credibility Analysis</p>
        </div>

        {!result && !isLoading && (
          <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500 }}>Para sa KK Member</span>
        )}
      </div>

      {/* Analyze button (before analysis) */}
      {!result && !isLoading && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'var(--blue-pale)', border: '1px solid var(--blue-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Shield size={24} style={{ color: 'var(--blue)' }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 6 }}>
            Suriin ang Credibility ng Programa
          </p>
          <p style={{ fontSize: 12, color: 'var(--gray-400)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto 18px' }}>
            Ang AI ay magsusuri ng mga komento, votes, budget, at detalye ng programa para magbigay ng credibility score.
          </p>
          <button
            onClick={onAnalyze}
            disabled={!canAnalyze}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontSize: 13 }}
          >
            <Sparkles size={14} />
            {canAnalyze ? 'I-analyze ang Credibility' : 'KK Member lang ang makakaanalisa'}
          </button>
        </div>
      )}

      {/* Loading / streaming state */}
      {isLoading && (
        <div style={{ padding: '20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Loader2 size={16} style={{ color: 'var(--blue)', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 500 }}>
              Sinusuri ng AI ang programa...
            </span>
          </div>
          {streamBuffer && (
            <div style={{
              background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
              borderRadius: 8, padding: '10px 12px',
              fontSize: 11, color: 'var(--gray-400)', fontFamily: 'monospace',
              maxHeight: 80, overflow: 'hidden',
              whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              {streamBuffer}
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {result && colors && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Score + Verdict */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: 16, borderRadius: 12,
            background: colors.bg, border: `1px solid ${colors.border}`,
          }}>
            <ScoreRing score={result.score} color={result.verdict_color} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <VerdictIcon verdict={result.verdict} />
                <span style={{
                  fontFamily: 'Syne', fontWeight: 800, fontSize: 16,
                  color: colors.text,
                }}>
                  {result.verdict}
                </span>
              </div>
              <p style={{ fontSize: 12, color: colors.text, lineHeight: 1.65, opacity: 0.85 }}>
                {result.summary}
              </p>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500 }}>Community:</span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: sentimentColor[result.community_sentiment] || '#9ca3af',
                }}>
                  {result.community_sentiment}
                </span>
              </div>
            </div>
          </div>

          {/* Strengths */}
          {result.strengths?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                ✓ Kalakasan
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {result.strengths.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    padding: '7px 10px', borderRadius: 8,
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                  }}>
                    <CheckCircle2 size={12} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, color: '#15803d', lineHeight: 1.5 }}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concerns */}
          {result.concerns?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                ! Alalahanin
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {result.concerns.map((c, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                    padding: '7px 10px', borderRadius: 8,
                    background: '#fef2f2', border: '1px solid #fecaca',
                  }}>
                    <AlertTriangle size={12} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, color: '#b91c1c', lineHeight: 1.5 }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {result.recommendation && (
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--blue-pale)', border: '1px solid var(--blue-light)',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <Sparkles size={13} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--blue)', lineHeight: 1.65, fontWeight: 500 }}>
                <strong>Rekomendasyon:</strong> {result.recommendation}
              </p>
            </div>
          )}

          {/* Re-analyze */}
          <button onClick={onAnalyze} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px', borderRadius: 8, border: '1px dashed var(--gray-200)',
            background: 'transparent', cursor: 'pointer', fontSize: 12,
            color: 'var(--gray-400)', transition: 'all 0.15s',
          }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.color = 'var(--gray-400)' }}
          >
            <Sparkles size={11} /> I-refresh ang Analysis
          </button>
        </div>
      )}
    </div>
  )
}