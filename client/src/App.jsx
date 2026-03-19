import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { Dashboard }     from './pages/Dashboard'
import { ProgramDetail } from './pages/ProgramDetail'
import { SKPortal }      from './pages/SKPortal'

export default function App() {
  const [view, setView] = useState('dashboard')
  const [selectedProgram, setSelectedProgram] = useState(null)

  return (
    <>
      <Toaster position="top-center" toastOptions={{
        style: { fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, borderRadius: 10 },
        success: { style: { borderLeft: '3px solid #16a34a' } },
        error:   { style: { borderLeft: '3px solid #ce1126' } },
      }} />

      {view === 'detail' && selectedProgram && (
        <ProgramDetail program={selectedProgram} onBack={() => { setView('dashboard'); setSelectedProgram(null) }} />
      )}
      {view === 'portal' && (
        <SKPortal onBack={() => setView('dashboard')} />
      )}
      {view === 'dashboard' && (
        <Dashboard
          onProgramClick={p => { setSelectedProgram(p); setView('detail') }}
          onGoToPortal={() => setView('portal')}
        />
      )}
    </>
  )
}