/**
 * src/App.jsx
 */
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { Dashboard }      from './pages/Dashboard'
import { ProgramDetail }  from './pages/ProgramDetail'
import { SKAdminPortal }  from './pages/SKAdminPortal'
import { AIPanel }        from './components/AIPanel'
import { AIToggleButton } from './components/AIToggleButton'
import { useAppStore }    from './store/appStore'

export default function App() {
  const { userRole } = useAppStore()
  const [page, setPage]                   = useState('dashboard')
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [aiOpen, setAiOpen]               = useState(false)

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

      {/* SK Official gets the full admin portal */}
      {page === 'portal' && (
        <SKAdminPortal onBack={handleBack} />
      )}

      {/* AI Panel only on dashboard and detail pages */}
      {page !== 'portal' && (
        <>
          <AIPanel isOpen={aiOpen} onClose={() => setAiOpen(false)} />
          <AIToggleButton
            isOpen={aiOpen}
            onClick={() => setAiOpen(prev => !prev)}
          />
        </>
      )}
    </>
  )
}