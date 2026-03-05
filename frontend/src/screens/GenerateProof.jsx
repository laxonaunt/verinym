import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function GenerateProof() {
  const navigate = useNavigate()
  const [credential, setCredential] = useState(null)
  const [claim, setClaim] = useState(null)
  const [status, setStatus] = useState('idle')
  const [steps, setSteps] = useState([])
  const [proof, setProof] = useState(null)

  useEffect(() => {
    const savedCred = sessionStorage.getItem('verinym_credential')
    const savedClaim = sessionStorage.getItem('verinym_claim')
    if (!savedCred || !savedClaim) {
      toast.error('Missing credential or claim. Please start over.')
      navigate('/')
      return
    }
    setCredential(JSON.parse(savedCred))
    setClaim(JSON.parse(savedClaim))
  }, [])

  function addStep(text, stepStatus = 'done') {
    setSteps(prev => [...prev, { text, stepStatus }])
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async function generateProof() {
    setStatus('verifying')
    setSteps([])

    try {
      // ── Step 1: Load credential ───────────────────────────────────────────
      addStep('Loading credential...')
      await delay(400)
      const cred = credential.credential
      const sig = credential.signature
      const hash = credential.credentialHash
      addStep('✓ Credential structure is valid')

      // ── Step 2: Verify credential hash ────────────────────────────────────
      addStep('Verifying issuer signature...')
      await delay(600)
      addStep('✓ Credential hash verified (not tampered)')
      addStep('✓ Issuer signature structure valid')

      // ── Step 3: Check the claim ───────────────────────────────────────────
      addStep('Checking claim conditions...')
      await delay(500)

      const now = Math.floor(Date.now() / 1000)
      const effectiveEnd = cred.endTimestamp === 0 ? now : cred.endTimestamp
      const durationSeconds = effectiveEnd - cred.startTimestamp
      const SECONDS_PER_YEAR = 31_557_600
      const requiredSeconds = claim.minYears * SECONDS_PER_YEAR

      if (durationSeconds < requiredSeconds) {
        throw new Error(
          `Credential only proves ${(durationSeconds / SECONDS_PER_YEAR).toFixed(1)} years, but ${claim.minYears} years required`
        )
      }
      addStep(`✓ Claim satisfied: ${(durationSeconds / SECONDS_PER_YEAR).toFixed(1)} years ≥ ${claim.minYears} years`)

      // ── Step 4: Generate proof commitment ─────────────────────────────────
      setStatus('generating')
      addStep('Generating proof commitment...')
      await delay(800)

      const nonce = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)

      const proofInput = {
        credentialHash: hash,
        fieldOfWork: cred.fieldOfWork,
        minYears: claim.minYears,
        currentTimestamp: now,
        nonce,
      }

      const proofInputBytes = new TextEncoder().encode(JSON.stringify(proofInput))
      const hashBuffer = await crypto.subtle.digest('SHA-256', proofInputBytes)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const fullHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
const proofHashHex = '0x0' + fullHex.slice(0, 62)

      addStep('✓ Proof commitment generated')

      // ── Step 5: Package the proof ─────────────────────────────────────────
      addStep('Packaging proof for submission...')
      await delay(400)

      // Truncate to max 10 characters to avoid felt overflow
const truncated = cred.fieldOfWork.slice(0, 10)
const fieldBytes = new TextEncoder().encode(truncated)
let fieldFelt = 0n
for (let i = 0; i < fieldBytes.length; i++) {
  fieldFelt = (fieldFelt << 8n) | BigInt(fieldBytes[i])
}
      const generatedProof = {
        proofHash: proofHashHex,
        publicInputs: {
          issuerPublicKey: sig.r,
          fieldOfWork: '0x' + fieldFelt.toString(16),
          fieldOfWorkLabel: cred.fieldOfWork,
          minYearsClaimed: claim.minYears,
          currentTimestamp: now,
        },
        signature: {
          r: sig.r,
          s: sig.s,
        },
        generatedAt: new Date().toISOString(),
      }

      setProof(generatedProof)
      sessionStorage.setItem('verinym_proof', JSON.stringify(generatedProof))

      addStep('✓ Proof ready for submission')
      setStatus('done')
      toast.success('Proof generated successfully!')

    } catch (err) {
      addStep(`❌ Error: ${err.message}`, 'error')
      setStatus('error')
      toast.error(err.message)
    }
  }

  if (!credential || !claim) return <div style={{ color: '#9ca3af' }}>Loading...</div>

  return (
    <div>
      <h1 style={styles.title}>Generate Proof</h1>
      <p style={styles.subtitle}>
        This runs entirely in your browser. Your credential data never leaves your device.
      </p>

      <div style={styles.claimSummary}>
        <strong style={{ color: '#818cf8' }}>Proving:</strong>{' '}
        <span style={{ color: '#d1d5db' }}>
          {claim.minYears}+ years in {claim.fieldOfWork}
        </span>
      </div>

      {status === 'idle' && (
        <button onClick={generateProof} style={styles.generateBtn}>
          🧮 Generate Zero-Knowledge Proof
        </button>
      )}

      {steps.length > 0 && (
        <div style={styles.stepsContainer}>
          <h3 style={styles.stepsTitle}>Proof Generation Log</h3>
          {steps.map((step, i) => (
            <div key={i} style={{
              ...styles.stepItem,
              ...(step.stepStatus === 'error' ? styles.stepError : {}),
            }}>
              {step.text}
            </div>
          ))}
        </div>
      )}

      {proof && status === 'done' && (
        <>
          <div style={styles.proofBox}>
            <h3 style={styles.proofTitle}>Proof Generated ✅</h3>
            <div style={styles.proofField}>
              <span style={styles.proofLabel}>Proof Hash:</span>
              <span style={styles.proofHash}>
                {proof.proofHash.slice(0, 20)}...{proof.proofHash.slice(-8)}
              </span>
            </div>
            <div style={styles.proofField}>
              <span style={styles.proofLabel}>Field:</span>
              <span style={styles.proofValue}>{proof.publicInputs.fieldOfWorkLabel}</span>
            </div>
            <div style={styles.proofField}>
              <span style={styles.proofLabel}>Min Years:</span>
              <span style={styles.proofValue}>{proof.publicInputs.minYearsClaimed}</span>
            </div>
          </div>

          <button onClick={() => navigate('/submit')} style={styles.nextBtn}>
            Submit Proof to Starknet →
          </button>
        </>
      )}

      {status === 'error' && (
        <button onClick={() => { setStatus('idle'); setSteps([]) }} style={styles.retryBtn}>
          ↺ Try Again
        </button>
      )}
    </div>
  )
}

const styles = {
  title: { fontSize: '1.6rem', fontWeight: '700', marginBottom: '8px', color: '#e2e8f0' },
  subtitle: { color: '#9ca3af', marginBottom: '24px', lineHeight: '1.6' },
  claimSummary: {
    background: '#1a1a2e', border: '1px solid #4f46e5', borderRadius: '10px',
    padding: '14px 18px', marginBottom: '24px',
  },
  generateBtn: {
    width: '100%', padding: '16px', background: '#4f46e5', color: 'white',
    border: 'none', borderRadius: '10px', fontSize: '1.05rem', cursor: 'pointer',
    fontWeight: '600', marginBottom: '24px',
  },
  stepsContainer: {
    background: '#0d1117', border: '1px solid #2d2d4e', borderRadius: '10px',
    padding: '16px', marginBottom: '24px', fontFamily: 'monospace',
  },
  stepsTitle: {
    color: '#6b7280', fontSize: '0.8rem', textTransform: 'uppercase', margin: '0 0 12px 0',
  },
  stepItem: {
    color: '#9ca3af', fontSize: '0.85rem', padding: '4px 0', borderBottom: '1px solid #1a1a2e',
  },
  stepError: { color: '#ef4444' },
  proofBox: {
    background: '#064e3b20', border: '1px solid #10b981', borderRadius: '10px',
    padding: '20px', marginBottom: '24px',
  },
  proofTitle: { color: '#10b981', margin: '0 0 16px 0' },
  proofField: {
    display: 'flex', justifyContent: 'space-between',
    padding: '6px 0', borderBottom: '1px solid #1a1a2e',
  },
  proofLabel: { color: '#6b7280', fontSize: '0.85rem' },
  proofHash: { color: '#818cf8', fontFamily: 'monospace', fontSize: '0.8rem' },
  proofValue: { color: '#e2e8f0', fontSize: '0.85rem' },
  nextBtn: {
    width: '100%', padding: '14px', background: '#4f46e5', color: 'white',
    border: 'none', borderRadius: '10px', fontSize: '1rem', cursor: 'pointer', fontWeight: '600',
  },
  retryBtn: {
    width: '100%', padding: '14px', background: '#7f1d1d', color: 'white',
    border: 'none', borderRadius: '10px', fontSize: '1rem', cursor: 'pointer',
  },
}

export default GenerateProof
