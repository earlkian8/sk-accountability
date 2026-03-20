/**
 * src/App.jsx
 * Root app with AI panel + toggle button integrated
 */

import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { Dashboard }       from './pages/Dashboard'
import { ProgramDetail }   from './pages/ProgramDetail'
import { SKPortal }        from './pages/SKPortal'
import { AIPanel }         from './components/AIPanel'
import { AIToggleButton }  from './components/AIToggleButton'

export default function App() {
  const [page, setPage] = useState('dashboard') // 'dashboard' | 'detail' | 'portal'
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [aiOpen, setAiOpen] = useState(false)

  const handleProgramClick = (program) => {
    setSelectedProgram(program)
    setPage('detail')
  }

  const handleBack = () => {
    setSelectedProgram(null)
    setPage('dashboard')
  }

  const handleGoToPortal = () => setPage('portal')

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { fontSize: 13, fontWeight: 600, borderRadius: 10 },
          duration: 3000,
        }}
      />

      {/* Pages */}
      {page === 'dashboard' && (
        <Dashboard
          onProgramClick={handleProgramClick}
          onGoToPortal={handleGoToPortal}
        />
      )}
      {page === 'detail' && selectedProgram && (
        <ProgramDetail
          program={selectedProgram}
          onBack={handleBack}
        />
      )}
      {page === 'portal' && (
        <SKPortal onBack={handleBack} />
      )}

      {/* AI Panel (renders on all pages) */}
      <AIPanel isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      {/* Floating toggle button */}
      <AIToggleButton
        isOpen={aiOpen}
        onClick={() => setAiOpen(prev => !prev)}
      />
    </>
  )
}