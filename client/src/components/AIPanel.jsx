/**
 * src/components/AIPanel.jsx
 * Collapsible AI side panel — role-aware
 * Public: Transparency chatbot
 * KK Member: Program credibility analysis (triggered from ProgramDetail)
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '../store/appStore'
import { streamChat } from '../ai/geminiService'
import {
  Sparkles, X, ChevronRight, Send, Loader2,
  MessageSquare, Bot, User, RefreshCw, AlertCircle,
  ChevronDown,
} from 'lucide-react'

// ── Typing indicator dots ────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'rgba(255,255,255,0.5)',
          display: 'inline-block',
          animation: `aiDotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  )
}

// ── Single chat message bubble ───────────────────────────────
function ChatBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 8,
      alignItems: 'flex-end',
    }}>
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'rgba(252,209,22,0.2)' : 'rgba(255,255,255,0.1)',
        border: `1px solid ${isUser ? 'rgba(252,209,22,0.4)' : 'rgba(255,255,255,0.15)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isUser
          ? <User size={13} style={{ color: '#fcd116' }} />
          : <Bot size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
        }
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '78%',
        padding: '10px 13px',
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isUser
          ? 'linear-gradient(135deg, rgba(252,209,22,0.2), rgba(252,209,22,0.1))'
          : 'rgba(255,255,255,0.08)',
        border: `1px solid ${isUser ? 'rgba(252,209,22,0.25)' : 'rgba(255,255,255,0.1)'}`,
        fontSize: 13,
        lineHeight: 1.65,
        color: isUser ? '#fef9e7' : 'rgba(255,255,255,0.9)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {message.typing ? <TypingDots /> : message.text}
      </div>
    </div>
  )
}

// ── Suggested question pill ──────────────────────────────────
function SuggestedQuestion({ text, onClick }) {
  return (
    <button onClick={() => onClick(text)} style={{
      padding: '7px 12px',
      borderRadius: 99,
      border: '1px solid rgba(255,255,255,0.15)',
      background: 'rgba(255,255,255,0.06)',
      color: 'rgba(255,255,255,0.75)',
      fontSize: 12,
      cursor: 'pointer',
      transition: 'all 0.15s',
      textAlign: 'left',
      lineHeight: 1.4,
    }}
      onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
      onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
    >
      {text}
    </button>
  )
}

// ── Public suggestions based on data ────────────────────────
function getPublicSuggestions(programs, barangay) {
  const suggestions = [
    'Magkano ang kabuuang gastos ng SK?',
    'Ilan ang mga verified na programa?',
  ]
  if (programs?.length) {
    const top = programs.sort((a, b) => b.budget - a.budget)[0]
    if (top) suggestions.push(`Ano ang programa na "${top.name}"?`)
    const flagged = programs.filter(p => p.status === 'flagged')
    if (flagged.length) suggestions.push(`Bakit may mga flagged na programa?`)
    else suggestions.push('Ano ang mga health programs ng SK?')
  }
  return suggestions.slice(0, 4)
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export function AIPanel({ isOpen, onClose }) {
  const { userRole, selectedBarangay, programs } = useAppStore()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(true)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const streamingIdRef = useRef(null)

  const isPublic = userRole === 'public'
  const isKKMember = userRole === 'kk-member'
  const isSKOfficial = userRole === 'sk-official'

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && isPublic) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, isPublic])

  // Reset when barangay changes
  useEffect(() => {
    setMessages([])
    setShowSuggestions(true)
    setError(null)
  }, [selectedBarangay?.code])

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || isStreaming) return

    setInput('')
    setError(null)
    setShowSuggestions(false)

    const userMsg = { id: Date.now(), role: 'user', text: trimmed }
    const botId = Date.now() + 1
    streamingIdRef.current = botId

    setMessages(prev => [
      ...prev,
      userMsg,
      { id: botId, role: 'model', text: '', typing: true },
    ])
    setIsStreaming(true)

    // Build history (exclude the typing placeholder)
    const history = messages
      .filter(m => !m.typing)
      .map(m => ({ role: m.role, text: m.text }))

    await streamChat({
      history,
      userMessage: trimmed,
      barangay: selectedBarangay,
      programs,
      onChunk: (chunk) => {
        setMessages(prev => prev.map(m =>
          m.id === botId ? { ...m, text: m.text + chunk, typing: false } : m
        ))
      },
      onDone: () => {
        setIsStreaming(false)
        streamingIdRef.current = null
      },
      onError: (errMsg) => {
        setIsStreaming(false)
        setError(errMsg)
        setMessages(prev => prev.filter(m => m.id !== botId))
      },
    })
  }, [input, isStreaming, messages, selectedBarangay, programs])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setShowSuggestions(true)
    setError(null)
  }

  const suggestions = getPublicSuggestions(programs, selectedBarangay)

  // ── Panel not open ─────────────────────────────────────────
  if (!isOpen) return null

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 89,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(2px)',
          display: 'none',
        }}
        className="ai-backdrop"
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 380,
        zIndex: 90,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #0a1628 0%, #0d1f3c 40%, #0a1628 100%)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
        animation: 'aiPanelSlideIn 0.28s cubic-bezier(0.16,1,0.3,1)',
      }} className="ai-panel">

        {/* ── Panel Header ──────────────────────────────── */}
        <div style={{
          padding: '0 16px',
          height: 64,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
          background: 'rgba(255,255,255,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #0038a8, #ce1126)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,56,168,0.4)',
            }}>
              <Sparkles size={16} style={{ color: '#fcd116' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'Syne', letterSpacing: '-0.01em' }}>
                SKCheck AI
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                {isPublic && 'Transparency Assistant'}
                {isKKMember && 'Credibility Analyst'}
                {isSKOfficial && 'Program Insights'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {messages.length > 0 && (
              <button onClick={clearChat} title="Clear chat" style={{
                width: 30, height: 30, borderRadius: 8, border: 'none',
                background: 'rgba(255,255,255,0.07)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.5)', transition: 'all 0.15s',
              }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
              >
                <RefreshCw size={13} />
              </button>
            )}
            <button onClick={onClose} title="Close" style={{
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.07)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)', transition: 'all 0.15s',
            }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'white' }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Role badge ───────────────────────────────── */}
        <div style={{
          padding: '8px 16px',
          background: isPublic ? 'rgba(0,56,168,0.2)' : isKKMember ? 'rgba(252,209,22,0.1)' : 'rgba(206,17,38,0.15)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontSize: 11, fontWeight: 600,
          color: isPublic ? '#93c5fd' : isKKMember ? '#fcd116' : '#fca5a5',
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isPublic ? '#3b82f6' : isKKMember ? '#fcd116' : '#ef4444',
            display: 'inline-block', flexShrink: 0,
            boxShadow: `0 0 6px ${isPublic ? '#3b82f6' : isKKMember ? '#fcd116' : '#ef4444'}`,
          }} />
          {isPublic && `Asking about: ${selectedBarangay ? `Brgy. ${selectedBarangay.name}` : 'no barangay selected'}`}
          {isKKMember && 'Open a program to analyze its credibility →'}
          {isSKOfficial && 'Switch to KK Member for credibility analysis'}
        </div>

        {/* ── Messages area ────────────────────────────── */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: 12,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        }}>

          {/* Empty state */}
          {messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: '20px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(0,56,168,0.4), rgba(206,17,38,0.3))',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={24} style={{ color: '#fcd116' }} />
              </div>

              {isPublic && (
                <>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 5, fontFamily: 'Syne' }}>
                      Kumusta! Ako si SKCheck AI.
                    </p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 260 }}>
                      {selectedBarangay
                        ? `Maaari akong sagutin ang iyong mga tanong tungkol sa mga programa ng Brgy. ${selectedBarangay.name}.`
                        : 'Pumili muna ng barangay sa dashboard para masimulan ang aming pag-uusap.'}
                    </p>
                  </div>
                  {selectedBarangay && showSuggestions && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
                        Mungkahing Tanong
                      </p>
                      {suggestions.map((s, i) => (
                        <SuggestedQuestion key={i} text={s} onClick={sendMessage} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {isKKMember && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 5, fontFamily: 'Syne' }}>
                    Credibility Analyzer
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 260 }}>
                    Buksan ang isang programa at pindutin ang{' '}
                    <span style={{ color: '#fcd116', fontWeight: 600 }}>Analyze Credibility</span>{' '}
                    button para makita ang AI assessment.
                  </p>
                </div>
              )}

              {isSKOfficial && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 5, fontFamily: 'Syne' }}>
                    Para sa mga SK Official
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 260 }}>
                    Ang AI analysis ay para sa mga KK Member at Public. I-switch ang iyong role para ma-access ang AI features.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map(msg => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, padding: '10px 12px',
            }}>
              <AlertCircle size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input area (Public only) ─────────────────── */}
        {(isPublic) && (
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
            flexShrink: 0,
          }}>
            {!selectedBarangay && (
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: 8 }}>
                Pumili ng barangay para makapag-chat
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming || !selectedBarangay}
                placeholder={selectedBarangay ? 'Magtanong tungkol sa mga programa...' : 'Pumili muna ng barangay...'}
                rows={1}
                style={{
                  flex: 1, resize: 'none', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10, padding: '9px 12px',
                  background: 'rgba(255,255,255,0.07)',
                  color: 'white', fontSize: 13, lineHeight: 1.5,
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                  maxHeight: 100, overflowY: 'auto',
                  opacity: !selectedBarangay ? 0.5 : 1,
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,56,168,0.6)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isStreaming || !input.trim() || !selectedBarangay}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: 'none', flexShrink: 0,
                  background: isStreaming || !input.trim() || !selectedBarangay
                    ? 'rgba(255,255,255,0.1)'
                    : 'linear-gradient(135deg, #0038a8, #0050cc)',
                  cursor: isStreaming || !input.trim() || !selectedBarangay ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                  boxShadow: isStreaming || !input.trim() ? 'none' : '0 4px 12px rgba(0,56,168,0.4)',
                }}>
                {isStreaming
                  ? <Loader2 size={15} style={{ color: 'rgba(255,255,255,0.5)', animation: 'spin 1s linear infinite' }} />
                  : <Send size={15} style={{ color: input.trim() && selectedBarangay ? 'white' : 'rgba(255,255,255,0.3)' }} />
                }
              </button>
            </div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 6, textAlign: 'center' }}>
              Enter para mag-send · Shift+Enter para bagong linya
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes aiPanelSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes aiDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40%           { transform: translateY(-5px); opacity: 1; }
        }
        @media (max-width: 768px) {
          .ai-panel {
            width: 100% !important;
            top: auto !important;
            height: 85vh !important;
            border-left: none !important;
            border-top: 1px solid rgba(255,255,255,0.1) !important;
            border-radius: 20px 20px 0 0 !important;
            animation: aiPanelSlideUp 0.28s cubic-bezier(0.16,1,0.3,1) !important;
          }
          .ai-backdrop {
            display: block !important;
          }
        }
        @keyframes aiPanelSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .ai-panel ::-webkit-scrollbar { width: 4px; }
        .ai-panel ::-webkit-scrollbar-track { background: transparent; }
        .ai-panel ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </>
  )
}