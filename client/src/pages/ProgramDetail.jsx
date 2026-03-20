/**
 * src/pages/ProgramDetail.jsx
 * Program detail with CredibilityCard for KK Members
 */

import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { addComment } from '../api/client'
import { analyzeCredibility } from '../ai/geminiService'
import { StatusBadge }    from '../components/StatusBadge'
import { CategoryTag }    from '../components/CategoryIcon'
import { CredibilityCard } from '../components/CredibilityCard'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle2, Flag, Calendar, ImageIcon, Send, User, PhilippinePeso } from 'lucide-react'
import skLogo from '../assets/sk-logo.svg'

export function ProgramDetail({ program, onBack }) {
  const { vote, userRole, programs } = useAppStore()
  const live = programs.find(p => p.id === program.id) || program

  const [voted, setVoted] = useState(null)
  const [comments, setComments] = useState(live.comments || [])
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)

  // Credibility analysis state
  const [credResult, setCredResult] = useState(null)
  const [credLoading, setCredLoading] = useState(false)
  const [credStreamBuffer, setCredStreamBuffer] = useState('')

  const canVote = userRole === 'kk-member'

  const handleVote = async (type) => {
    if (voted) return
    try {
      await vote(live.id, type)
      setVoted(type)
      toast.success(type === 'verify' ? '✓ Na-verify mo ang programa!' : 'Na-flag mo ang programa.')
    } catch (e) {
      const msg = e.response?.data?.error || e.message
      toast.error(msg.includes('already') ? 'Naka-vote ka na sa programang ito.' : msg)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setPosting(true)
    try {
      const roleLabel = { public: 'Bisita', 'kk-member': 'KK Member', 'sk-official': 'SK Official' }[userRole]
      const c = await addComment(live.id, { author: `Anonymous ${roleLabel}`, role: roleLabel, text: commentText.trim() })
      setComments(p => [...p, c])
      setCommentText('')
      toast.success('Naidagdag ang komento!')
    } catch { toast.error('Hindi ma-post. Subukan ulit.') }
    finally { setPosting(false) }
  }

  const handleAnalyze = () => {
    setCredResult(null)
    setCredStreamBuffer('')
    setCredLoading(true)

    // Use live program data including latest comments
    const programWithComments = { ...live, comments }

    analyzeCredibility({
      program: programWithComments,
      allPrograms: programs,
      onChunk: (chunk) => {
        setCredStreamBuffer(prev => prev + chunk)
      },
      onDone: (result) => {
        setCredResult(result)
        setCredStreamBuffer('')
        setCredLoading(false)
        toast.success('Analysis kumpleto!')
      },
      onError: (err) => {
        setCredLoading(false)
        setCredStreamBuffer('')
        toast.error(`Analysis failed: ${err}`)
      },
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>

      {/* Header */}
      <header style={{
        background: 'var(--blue)', position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 2px 16px rgba(0,56,168,0.25)',
      }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--yellow) 60%, var(--red) 60%)' }} />
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onBack} className="btn btn-ghost" style={{ color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', padding: '6px 12px', fontSize: 13 }}>
            <ArrowLeft size={14} /> <span className="hidden-mobile">Bumalik</span>
          </button>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, color: 'white', letterSpacing: '-0.01em' }}>
            SKCheck
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Title card ── */}
        <div className="surface slide-up" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <StatusBadge status={live.status} />
            <CategoryTag category={live.category} />
          </div>

          <h1 className="heading" style={{ fontSize: 24, color: 'var(--gray-900)', marginBottom: 14, lineHeight: 1.25 }}>
            {live.name}
          </h1>

          {/* Location breadcrumb */}
          {(live.barangayName || live.cityName) && (
            <p style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 500, marginBottom: 10 }}>
              📍 Brgy. {live.barangayName}{live.cityName ? `, ${live.cityName}` : ''}{live.provinceName ? `, ${live.provinceName}` : ''}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--gray-100)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--gray-500)', fontWeight: 500 }}>
              <Calendar size={14} />
              {new Date(live.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Syne', fontWeight: 700, fontSize: 20, color: 'var(--blue)' }}>
              <PhilippinePeso size={16} />
              {Number(live.budget).toLocaleString()}
            </span>
          </div>

          <p style={{ fontSize: 14, color: 'var(--gray-600)', lineHeight: 1.75 }}>{live.description}</p>
        </div>

        {/* ── Photo ── */}
        {live.photoUrl ? (
          <div className="surface slide-up d1" style={{ overflow: 'hidden', padding: 0 }}>
            <img src={live.photoUrl} alt={live.name} style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }} />
          </div>
        ) : (
          <div className="surface slide-up d1" style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--blue-pale)', borderStyle: 'dashed' }}>
            <ImageIcon size={16} style={{ color: 'var(--gray-400)' }} />
            <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 500 }}>Walang larawang naka-attach</span>
          </div>
        )}

        {/* ── Verification ── */}
        <div className="surface slide-up d2" style={{ padding: 24 }}>
          <p className="label-caps" style={{ marginBottom: 18 }}>Community Verification</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div style={{ background: 'var(--green-light)', border: '1px solid #bbf7d0', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <CheckCircle2 size={22} style={{ color: 'var(--green)', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 30, color: 'var(--green)', lineHeight: 1 }}>{live.verifications}</div>
                <div style={{ fontSize: 12, color: '#15803d', opacity: 0.8, marginTop: 3, fontWeight: 500 }}>nag-verify</div>
              </div>
            </div>
            <div style={{ background: 'var(--red-light)', border: '1px solid #fecaca', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <Flag size={22} style={{ color: 'var(--red)', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 30, color: 'var(--red)', lineHeight: 1 }}>{live.flags}</div>
                <div style={{ fontSize: 12, color: '#b91c1c', opacity: 0.8, marginTop: 3, fontWeight: 500 }}>nag-flag</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--blue-pale)', border: '1px solid var(--blue-light)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 18, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--blue)', fontWeight: 600 }}>✓ 3+ verifications → Community Verified</span>
            <span style={{ color: 'var(--gray-300)' }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>! 2+ flags → Flagged para sa imbestigasyon</span>
          </div>

          {canVote ? (
            voted ? (
              <div style={{ textAlign: 'center', padding: '13px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--gray-500)', fontWeight: 500 }}>
                {voted === 'verify' ? '✓ Nag-verify ka na para sa programang ito.' : '! Nag-flag ka na para sa programang ito.'}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => handleVote('verify')} className="btn btn-success-ghost" style={{ flex: 1, fontSize: 14, padding: '12px' }}>
                  <CheckCircle2 size={15} /> Nangyari Ito
                </button>
                <button onClick={() => handleVote('flag')} className="btn btn-danger-ghost" style={{ flex: 1, fontSize: 14, padding: '12px' }}>
                  <Flag size={15} /> Hindi Ko Nakita
                </button>
              </div>
            )
          ) : (
            <div style={{ textAlign: 'center', padding: '13px', border: '1px dashed var(--gray-300)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--gray-400)' }}>
              {userRole === 'public'
                ? 'Mag-switch sa KK Member para makapag-verify o mag-flag'
                : 'Bilang SK Official, hindi ka makapag-vote sa iyong sariling programa'}
            </div>
          )}
        </div>

        {/* ── AI Credibility Card (KK Member) ── */}
        <CredibilityCard
          result={credResult}
          isLoading={credLoading}
          streamBuffer={credStreamBuffer}
          onAnalyze={handleAnalyze}
          canAnalyze={userRole === 'kk-member'}
        />

        {/* ── Comments ── */}
        <div className="surface slide-up d4" style={{ padding: 24 }}>
          <p className="label-caps" style={{ marginBottom: 18 }}>
            Mga Komento {comments.length > 0 && <span style={{ color: 'var(--blue)', fontWeight: 700 }}>({comments.length})</span>}
          </p>

          {comments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 20 }}>
              {comments.map((c, i) => (
                <div key={c.id} style={{
                  display: 'flex', gap: 12, padding: '14px 0',
                  borderBottom: i < comments.length - 1 ? '1px solid var(--gray-100)' : 'none',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue-pale)', border: '1px solid var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <User size={14} style={{ color: 'var(--blue)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-900)' }}>{c.author}</span>
                      <span className="badge badge-blue" style={{ fontSize: 11, padding: '2px 8px' }}>{c.role}</span>
                      <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 'auto' }}>
                        {new Date(c.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.7 }}>{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {comments.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 20, textAlign: 'center', padding: '16px 0' }}>
              Wala pang komento. Maging una.
            </p>
          )}

          <form onSubmit={handleComment} style={{ display: 'flex', gap: 8 }}>
            <input className="input" value={commentText} onChange={e => setCommentText(e.target.value)}
              placeholder="Mag-iwan ng komento para sa komunidad..." style={{ flex: 1 }} />
            <button type="submit" disabled={posting || !commentText.trim()} className="btn btn-primary" style={{ padding: '0 18px', flexShrink: 0 }}>
              <Send size={14} /> {posting ? '...' : 'Post'}
            </button>
          </form>
        </div>

      </main>
    </div>
  )
}