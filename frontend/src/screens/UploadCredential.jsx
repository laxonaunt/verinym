import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function UploadCredential() {
  const navigate = useNavigate()
  const [credential, setCredential] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file) {
    if (!file?.name.endsWith('.json')) {
      toast.error('Please upload a JSON credential file')
      return
    }
    try {
      const parsed = JSON.parse(await file.text())
      if (!parsed.credential || !parsed.signature) {
        toast.error('Invalid credential file format')
        return
      }
      setCredential(parsed)
      sessionStorage.setItem('verinym_credential', JSON.stringify(parsed))
      toast.success('Credential loaded')
    } catch {
      toast.error('Could not read file')
    }
  }

  return (
    <div>
      <p style={s.eyebrow}>Step 1 of 4</p>
      <h1 style={s.title}>Upload Credential</h1>
      <p style={s.sub}>
        Your credential is a JSON file from a trusted issuer. It stays on your device —
        nothing is uploaded to any server.
      </p>

      <div
        style={{
          ...s.dropzone,
          ...(dragOver ? s.dropzoneOver : {}),
          ...(credential ? s.dropzoneDone : {}),
        }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
        onClick={() => document.getElementById('fi').click()}
      >
        <input id="fi" type="file" accept=".json" style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])} />

        {credential ? (
          <>
            <div style={s.dropIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={s.dropTitle}>Credential loaded</p>
            <p style={s.dropSub}>Click to load a different file</p>
          </>
        ) : (
          <>
            <div style={s.dropIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p style={s.dropTitle}>Drop credential.json here</p>
            <p style={s.dropSub}>or click to browse</p>
          </>
        )}
      </div>

      {credential && (
        <div style={s.card}>
          <div style={s.cardHeader}>Credential Details</div>
          <div style={s.row}>
            <span style={s.rowLabel}>Field of Work</span>
            <span style={s.rowValue}>{credential.credential.fieldOfWork}</span>
          </div>
          <div style={s.row}>
            <span style={s.rowLabel}>Start Date</span>
            <span style={s.rowValue}>
              {new Date(credential.credential.startTimestamp * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </span>
          </div>
          <div style={s.row}>
            <span style={s.rowLabel}>Status</span>
            <span style={{ ...s.rowValue, color: 'var(--green)' }}>
              {credential.credential.endTimestamp === 0 ? 'Currently Employed' : 'Former Employee'}
            </span>
          </div>
          <div style={{ ...s.row, borderBottom: 'none' }}>
            <span style={s.rowLabel}>Credential ID</span>
            <span style={{ ...s.rowValue, fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text2)' }}>
              {credential.credential.credentialId.slice(0, 20)}...
            </span>
          </div>
          <div style={s.notice}>
            Your identity and credential details are never submitted on-chain. Only a zero-knowledge proof is.
          </div>
        </div>
      )}

      <button
        onClick={() => credential ? navigate('/claim') : toast.error('Upload a credential first')}
        style={{ ...s.btn, ...(credential ? {} : s.btnDisabled) }}
      >
        Continue to Claim Selection
      </button>
    </div>
  )
}

const s = {
  eyebrow: { fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' },
  title: { fontSize: '1.75rem', fontWeight: '600', letterSpacing: '-0.03em', marginBottom: '10px', color: 'var(--text)' },
  sub: { color: 'var(--text2)', fontSize: '0.9rem', lineHeight: '1.65', marginBottom: '28px', maxWidth: '480px' },
  dropzone: {
    border: '1px dashed var(--border2)',
    borderRadius: '10px',
    padding: '48px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginBottom: '16px',
    background: 'var(--bg2)',
  },
  dropzoneOver: { borderColor: 'var(--green)', background: 'var(--green-dim)' },
  dropzoneDone: { borderColor: 'var(--green)', borderStyle: 'solid' },
  dropIcon: { marginBottom: '12px', display: 'flex', justifyContent: 'center' },
  dropTitle: { fontSize: '0.9rem', color: 'var(--text)', marginBottom: '4px', fontWeight: '500' },
  dropSub: { fontSize: '0.8rem', color: 'var(--text3)' },
  card: {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '24px',
  },
  cardHeader: {
    padding: '12px 16px',
    fontSize: '0.75rem',
    fontWeight: '500',
    color: 'var(--text3)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg3)',
    fontFamily: 'var(--mono)',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
  },
  rowLabel: { fontSize: '0.85rem', color: 'var(--text2)' },
  rowValue: { fontSize: '0.85rem', color: 'var(--text)', fontWeight: '500' },
  notice: {
    padding: '12px 16px',
    fontSize: '0.78rem',
    color: 'var(--text3)',
    lineHeight: '1.5',
    borderTop: '1px solid var(--border)',
  },
  btn: {
    width: '100%',
    padding: '13px',
    background: 'var(--green)',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'var(--font)',
  },
  btnDisabled: { background: 'var(--bg3)', color: 'var(--text3)', cursor: 'not-allowed' },
}