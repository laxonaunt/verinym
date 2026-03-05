import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const YEAR_OPTIONS = [1, 2, 3, 5, 7, 10]

export default function SelectClaim() {
  const navigate = useNavigate()
  const [credential, setCredential] = useState(null)
  const [selectedYears, setSelectedYears] = useState(null)
  const [maxYears, setMaxYears] = useState(0)

  useEffect(() => {
    const saved = sessionStorage.getItem('verinym_credential')
    if (!saved) { navigate('/'); return }
    const cred = JSON.parse(saved)
    setCredential(cred)
    const now = Math.floor(Date.now() / 1000)
    const end = cred.credential.endTimestamp || now
    const years = (end - cred.credential.startTimestamp) / (365.25 * 24 * 3600)
    setMaxYears(Math.floor(years))
  }, [])

  function handleContinue() {
    if (!selectedYears) { toast.error('Select a claim first'); return }
    sessionStorage.setItem('verinym_claim', JSON.stringify({
      minYears: selectedYears,
      fieldOfWork: credential.credential.fieldOfWork,
    }))
    navigate('/generate')
  }

  if (!credential) return null

  return (
    <div>
      <p style={s.eyebrow}>Step 2 of 4</p>
      <h1 style={s.title}>Select Claim</h1>
      <p style={s.sub}>
        Choose the minimum experience threshold to prove. The verifier will only see
        this threshold — not your exact duration or any personal details.
      </p>

      <div style={s.context}>
        <span style={s.contextLabel}>Credential covers</span>
        <span style={s.contextValue}>{credential.credential.fieldOfWork} · {maxYears}+ years provable</span>
      </div>

      <div style={s.claimPreview}>
        <span style={s.claimPreviewLabel}>You will prove:</span>
        <p style={s.claimStatement}>
          "I have at least{' '}
          <span style={s.highlight}>{selectedYears ?? '—'} year{selectedYears !== 1 ? 's' : ''}</span>
          {' '}of experience in{' '}
          <span style={s.highlight}>{credential.credential.fieldOfWork}</span>"
        </p>
      </div>

      <div style={s.grid}>
        {YEAR_OPTIONS.map(y => {
          const canProve = y <= maxYears
          const selected = selectedYears === y
          return (
            <button
              key={y}
              onClick={() => canProve && setSelectedYears(y)}
              disabled={!canProve}
              style={{
                ...s.yearBtn,
                ...(selected ? s.yearBtnSelected : {}),
                ...(!canProve ? s.yearBtnDisabled : {}),
              }}
            >
              <span style={s.yearNum}>{y}</span>
              <span style={s.yearUnit}>yr{y !== 1 ? 's' : ''}</span>
              {canProve && <span style={{ ...s.badge, ...(selected ? s.badgeSelected : {}) }}>
                {selected ? 'Selected' : 'Provable'}
              </span>}
            </button>
          )
        })}
      </div>

      <div style={s.privacyCard}>
        <div style={s.privacyTitle}>What the verifier sees</div>
        <div style={s.privacyGrid}>
          {[
            { label: 'Field of work', value: credential.credential.fieldOfWork, visible: true },
            { label: 'Minimum years', value: selectedYears ? `${selectedYears}+` : '—', visible: true },
            { label: 'Your name', value: 'Hidden', visible: false },
            { label: 'Your wallet', value: 'Hidden', visible: false },
            { label: 'Exact duration', value: 'Hidden', visible: false },
            { label: 'Employer name', value: 'Hidden', visible: false },
          ].map(item => (
            <div key={item.label} style={s.privacyRow}>
              <span style={s.privacyLabel}>{item.label}</span>
              <span style={{ ...s.privacyValue, color: item.visible ? 'var(--text)' : 'var(--text3)' }}>
                {item.visible ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={s.dot} />
                    {item.value}
                  </span>
                ) : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleContinue}
        style={{ ...s.btn, ...(!selectedYears ? s.btnDisabled : {}) }}
      >
        Generate Proof
      </button>
    </div>
  )
}

const s = {
  eyebrow: { fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' },
  title: { fontSize: '1.75rem', fontWeight: '600', letterSpacing: '-0.03em', marginBottom: '10px' },
  sub: { color: 'var(--text2)', fontSize: '0.9rem', lineHeight: '1.65', marginBottom: '28px', maxWidth: '480px' },
  context: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '12px 16px', marginBottom: '16px',
  },
  contextLabel: { fontSize: '0.8rem', color: 'var(--text3)' },
  contextValue: { fontSize: '0.85rem', color: 'var(--green)', fontWeight: '500', fontFamily: 'var(--mono)' },
  claimPreview: {
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '16px', marginBottom: '24px',
  },
  claimPreviewLabel: { fontSize: '0.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '8px', fontFamily: 'var(--mono)' },
  claimStatement: { fontSize: '1rem', color: 'var(--text2)', lineHeight: '1.6' },
  highlight: { color: 'var(--green)', fontWeight: '600' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' },
  yearBtn: {
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '16px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '2px', position: 'relative', transition: 'border-color 0.15s',
  },
  yearBtnSelected: { border: '1px solid var(--green)', background: 'var(--green-dim)' },
  yearBtnDisabled: { opacity: 0.3, cursor: 'not-allowed' },
  yearNum: { fontSize: '1.5rem', fontWeight: '600', color: 'var(--text)', fontFamily: 'var(--mono)' },
  yearUnit: { fontSize: '0.75rem', color: 'var(--text3)' },
  badge: {
    position: 'absolute', top: '6px', right: '6px',
    fontSize: '0.6rem', background: 'var(--bg3)', color: 'var(--text3)',
    padding: '2px 5px', borderRadius: '3px', fontFamily: 'var(--mono)',
  },
  badgeSelected: { background: 'var(--green)', color: '#000' },
  privacyCard: {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: '8px', overflow: 'hidden', marginBottom: '24px',
  },
  privacyTitle: {
    padding: '10px 16px', fontSize: '0.75rem', color: 'var(--text3)',
    textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)',
    background: 'var(--bg3)', fontFamily: 'var(--mono)',
  },
  privacyGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr' },
  privacyRow: {
    display: 'flex', flexDirection: 'column', gap: '2px',
    padding: '10px 16px', borderBottom: '1px solid var(--border)',
  },
  privacyLabel: { fontSize: '0.72rem', color: 'var(--text3)' },
  privacyValue: { fontSize: '0.82rem', fontWeight: '500' },
  dot: { width: '5px', height: '5px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' },
  btn: {
    width: '100%', padding: '13px', background: 'var(--green)', color: '#000',
    border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600',
    cursor: 'pointer', fontFamily: 'var(--font)',
  },
  btnDisabled: { background: 'var(--bg3)', color: 'var(--text3)', cursor: 'not-allowed' },
}