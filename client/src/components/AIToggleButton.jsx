/**
 * src/components/AIToggleButton.jsx
 * Floating button that opens/closes the AI panel
 * Positioned fixed bottom-right, above footer
 */

import { Sparkles, X } from 'lucide-react'

export function AIToggleButton({ isOpen, onClick, hasUnread }) {
  return (
    <button
      onClick={onClick}
      title={isOpen ? 'Close AI Assistant' : 'Open SKCheck AI'}
      style={{
        position: 'fixed',
        bottom: 24,
        right: isOpen ? 396 : 24,
        zIndex: 91,
        width: 52,
        height: 52,
        borderRadius: 16,
        border: 'none',
        cursor: 'pointer',
        background: isOpen
          ? 'linear-gradient(135deg, #1a1a2e, #0d1f3c)'
          : 'linear-gradient(135deg, #0038a8, #ce1126)',
        boxShadow: isOpen
          ? '0 4px 20px rgba(0,0,0,0.4)'
          : '0 4px 20px rgba(0,56,168,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.28s cubic-bezier(0.16,1,0.3,1)',
        transform: 'translateY(0)',
      }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isOpen ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 28px rgba(0,56,168,0.6), 0 0 0 1px rgba(255,255,255,0.15)' }}
      onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isOpen ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,56,168,0.5), 0 0 0 1px rgba(255,255,255,0.1)' }}
    >
      {isOpen
        ? <X size={20} style={{ color: 'rgba(255,255,255,0.8)' }} />
        : <Sparkles size={20} style={{ color: '#fcd116' }} />
      }

      {/* Unread indicator */}
      {hasUnread && !isOpen && (
        <span style={{
          position: 'absolute',
          top: 8, right: 8,
          width: 10, height: 10,
          borderRadius: '50%',
          background: '#fcd116',
          border: '2px solid #0038a8',
          boxShadow: '0 0 6px rgba(252,209,22,0.6)',
        }} />
      )}

      {/* Pulse ring when closed */}
      {!isOpen && (
        <span style={{
          position: 'absolute',
          inset: -3,
          borderRadius: 19,
          border: '2px solid rgba(0,56,168,0.4)',
          animation: 'aiBtnPulse 2.5s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      <style>{`
        @keyframes aiBtnPulse {
          0%   { transform: scale(1);    opacity: 0.7; }
          70%  { transform: scale(1.25); opacity: 0; }
          100% { transform: scale(1.25); opacity: 0; }
        }
        @media (max-width: 768px) {
          .ai-toggle-btn {
            right: 16px !important;
            bottom: 16px !important;
          }
        }
      `}</style>
    </button>
  )
}