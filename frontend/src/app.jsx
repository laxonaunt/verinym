import { Routes, Route, Link, useLocation } from 'react-router-dom'
import UploadCredential from './screens/UploadCredential'
import SelectClaim from './screens/SelectClaim'
import GenerateProof from './screens/GenerateProof'
import SubmitProof from './screens/SubmitProof'
import PublicVerifier from './screens/PublicVerifier'
import WalletConnect from './components/WalletConnect'

const STEPS = [
  { path: '/', label: 'Upload' },
  { path: '/claim', label: 'Select Claim' },
  { path: '/generate', label: 'Generate Proof' },
  { path: '/submit', label: 'Submit' },
]

export default function App() {
  const location = useLocation()
  const isVerifier = location.pathname.startsWith('/verify')
  const currentStep = STEPS.findIndex(s => s.path === location.pathname)

  if (isVerifier) {
    return (
      <Routes>
        <Route path="/verify/:verificationId" element={<PublicVerifier />} />
      </Routes>
    )
  }

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <Link to="/" style={s.logo}>
          <div style={s.logoMark}>V</div>
          <span style={s.logoText}>Verinym</span>
        </Link>
        <div style={s.headerRight}>
          <span style={s.network}>Starknet Sepolia</span>
          <WalletConnect />
        </div>
      </header>

      {/* Step indicator */}
      <div style={s.stepBar}>
        {STEPS.map((step, i) => (
          <div key={step.path} style={s.stepItem}>
            <div style={{
              ...s.stepDot,
              ...(i === currentStep ? s.stepDotActive : {}),
              ...(i < currentStep ? s.stepDotDone : {}),
            }}>
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span style={{
              ...s.stepLabel,
              ...(i === currentStep ? s.stepLabelActive : {}),
            }}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div style={{
                ...s.stepLine,
                ...(i < currentStep ? s.stepLineDone : {}),
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Page content */}
      <main style={s.main}>
        <Routes>
          <Route path="/" element={<UploadCredential />} />
          <Route path="/claim" element={<SelectClaim />} />
          <Route path="/generate" element={<GenerateProof />} />
          <Route path="/submit" element={<SubmitProof />} />
        </Routes>
      </main>

      <footer style={s.footer}>
        <span>Verinym — Private credential proofs on Starknet</span>
        <span style={{ color: 'var(--text3)' }}>Zero personal data stored on-chain</span>
      </footer>
    </div>
  )
}

const s = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: '64px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoMark: {
    width: '28px',
    height: '28px',
    background: 'var(--green)',
    color: '#000',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.85rem',
    fontFamily: 'var(--mono)',
  },
  logoText: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text)',
    letterSpacing: '-0.02em',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  network: {
    fontSize: '0.75rem',
    color: 'var(--text3)',
    fontFamily: 'var(--mono)',
    background: 'var(--bg3)',
    padding: '4px 10px',
    borderRadius: '4px',
    border: '1px solid var(--border)',
  },
  stepBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 32px',
    borderBottom: '1px solid var(--border)',
    gap: '0',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stepDot: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '1px solid var(--border2)',
    background: 'var(--bg2)',
    color: 'var(--text3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontFamily: 'var(--mono)',
    fontWeight: '500',
    flexShrink: 0,
  },
  stepDotActive: {
    background: 'var(--green)',
    border: '1px solid var(--green)',
    color: '#000',
    fontWeight: '700',
  },
  stepDotDone: {
    background: 'var(--green-dim)',
    border: '1px solid var(--green)',
    color: 'var(--green)',
  },
  stepLabel: {
    fontSize: '0.8rem',
    color: 'var(--text3)',
    whiteSpace: 'nowrap',
  },
  stepLabelActive: {
    color: 'var(--text)',
    fontWeight: '500',
  },
  stepLine: {
    width: '48px',
    height: '1px',
    background: 'var(--border2)',
    margin: '0 8px',
  },
  stepLineDone: {
    background: 'var(--green)',
    opacity: 0.4,
  },
  main: {
    flex: 1,
    maxWidth: '640px',
    width: '100%',
    margin: '0 auto',
    padding: '48px 24px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    borderTop: '1px solid var(--border)',
    fontSize: '0.75rem',
    color: 'var(--text2)',
  },
}
