import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const ALCHEMY_RPC = 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/FyJ2KCJhRiV4Bm-_JfuFY'
const PROOF_VERIFIER_ADDRESS = '0x066d578e0b372de4cf87b90fd4eff2c740d92d7d0622d6110b30da8649b0941b'

export default function PublicVerifier() {
  const { verificationId } = useParams()
  const [status, setStatus] = useState('loading')
  const [claimData, setClaimData] = useState(null)

  useEffect(() => {
    check()
  }, [verificationId])

  async function check() {
    try {
      const { RpcProvider } = await import('starknet')
      const provider = new RpcProvider({ nodeUrl: ALCHEMY_RPC })

      // Get the transaction receipt using the tx hash
      const receipt = await provider.getTransactionReceipt(verificationId)
      console.log('Receipt:', receipt)

      // Check if transaction succeeded
      if (!receipt || receipt.execution_status === 'REVERTED') {
        setStatus('not_found')
        return
      }

      // Check it was sent to our contract by looking at events
      const ourEvents = receipt.events?.filter(e => {
  const eventAddr = BigInt(e.from_address).toString(16)
  const contractAddr = BigInt(PROOF_VERIFIER_ADDRESS).toString(16)
  return eventAddr === contractAddr
})

      console.log('Our events:', ourEvents)

      if (!ourEvents || ourEvents.length === 0) {
        setStatus('not_found')
        return
      }

      // Parse claim data from the event data fields
      // ClaimVerified event structure:
      // keys[0] = event selector
      // keys[1] = verification_id
      // data[0] = issuer_public_key
      // data[1] = field_of_work (felt)
      // data[2] = min_years_claimed
      // data[3] = timestamp
      const event = ourEvents[0]
      console.log('Event:', event)

      function feltToString(felt) {
        if (!felt) return 'Unknown'
        try {
          let n = BigInt(felt), str = ''
          while (n > 0n) {
            str = String.fromCharCode(Number(n & 0xffn)) + str
            n >>= 8n
          }
          return str || felt.toString()
        } catch { return felt.toString() }
      }

      const parsed = {
        fieldOfWork: event.data?.[1] ? feltToString(event.data[1]) : 'Unknown',
        minYears: event.data?.[2] ? BigInt(event.data[2]).toString() : '?',
        timestamp: event.data?.[3]
          ? new Date(Number(BigInt(event.data[3])) * 1000).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            })
          : null,
      }

      console.log('Parsed claim:', parsed)
      setClaimData(parsed)
      setStatus('verified')

    } catch (err) {
      console.error('Verifier error:', err)
      setStatus('error')
    }
  }

  return (
    <div style={s.page}>
      <div style={s.container}>

        <div style={s.header}>
          <div style={s.logo}>
            <div style={s.logoMark}>V</div>
            <span style={s.logoText}>Verinym</span>
          </div>
          <span style={s.badge}>Credential Verification</span>
        </div>

        <div style={s.idBox}>
          <span style={s.idLabel}>Verification ID</span>
          <span style={s.idValue}>{verificationId?.slice(0, 14)}...{verificationId?.slice(-8)}</span>
        </div>

        {status === 'loading' && (
          <div style={s.center}>
            <div style={s.spinner} />
            <p style={s.loadingText}>Checking Starknet...</p>
          </div>
        )}

        {status === 'verified' && claimData && (
          <div style={s.verifiedCard}>
            <div style={s.verifiedHeader}>
              <div style={s.verifiedDot} />
              <span style={s.verifiedLabel}>Verified On-Chain</span>
            </div>

            <div style={s.claimBox}>
              <p style={s.claimBoxLabel}>Verified Claim</p>
              <p style={s.claimStatement}>
                This person has at least{' '}
                <strong style={{ color: 'var(--green)' }}>
                  {claimData.minYears} year{claimData.minYears !== '1' ? 's' : ''}
                </strong>
                {' '}of professional experience in{' '}
                <strong style={{ color: 'var(--green)' }}>{claimData.fieldOfWork}</strong>
              </p>
            </div>

            <div style={s.metaGrid}>
              {[
                ['Network', 'Starknet Sepolia'],
                ['Verified', claimData.timestamp ?? 'On-chain'],
                ['Identity Revealed', 'None'],
                ['Personal Data On-Chain', 'None'],
              ].map(([label, value]) => (
                <div key={label} style={s.metaItem}>
                  <span style={s.metaLabel}>{label}</span>
                  <span style={{
                    ...s.metaValue,
                    ...(label === 'Identity Revealed' || label === 'Personal Data On-Chain'
                      ? { color: 'var(--green)' } : {}),
                  }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'not_found' && (
          <div style={s.errorCard}>
            <p style={s.errorTitle}>Verification Not Found</p>
            <p style={s.errorSub}>
              No verified claim exists for this ID. The link may be incorrect or
              the proof has not been submitted yet.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div style={s.errorCard}>
            <p style={s.errorTitle}>Connection Error</p>
            <p style={s.errorSub}>Could not connect to Starknet. Please try again.</p>
            <button onClick={check} style={s.retryBtn}>Retry</button>
          </div>
        )}

        <div style={s.footer}>
          Verinym uses zero-knowledge proofs on Starknet. No personal data is stored on-chain.
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: 'var(--bg)', display: 'flex', justifyContent: 'center', padding: '48px 24px', fontFamily: 'var(--font)' },
  container: { width: '100%', maxWidth: '520px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' },
  logo: { display: 'flex', alignItems: 'center', gap: '8px' },
  logoMark: { width: '26px', height: '26px', background: 'var(--green)', color: '#000', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.8rem', fontFamily: 'var(--mono)' },
  logoText: { fontSize: '0.95rem', fontWeight: '600', color: 'var(--text)', letterSpacing: '-0.02em' },
  badge: { fontSize: '0.72rem', color: 'var(--text3)', background: 'var(--bg2)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '4px', fontFamily: 'var(--mono)' },
  idBox: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  idLabel: { fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--mono)' },
  idValue: { fontSize: '0.78rem', color: 'var(--text2)', fontFamily: 'var(--mono)' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '64px 0' },
  spinner: { width: '20px', height: '20px', border: '2px solid var(--border2)', borderTop: '2px solid var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  loadingText: { fontSize: '0.85rem', color: 'var(--text3)' },
  verifiedCard: { background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' },
  verifiedHeader: { display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 16px', borderBottom: '1px solid rgba(18,255,128,0.15)' },
  verifiedDot: { width: '7px', height: '7px', borderRadius: '50%', background: 'var(--green)' },
  verifiedLabel: { fontSize: '0.82rem', color: 'var(--green)', fontWeight: '600', fontFamily: 'var(--mono)' },
  claimBox: { padding: '20px 16px', borderBottom: '1px solid rgba(18,255,128,0.15)' },
  claimBoxLabel: { fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontFamily: 'var(--mono)' },
  claimStatement: { fontSize: '1rem', color: 'var(--text2)', lineHeight: '1.6' },
  metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr' },
  metaItem: { padding: '12px 16px', borderRight: '1px solid rgba(18,255,128,0.1)', borderBottom: '1px solid rgba(18,255,128,0.1)', display: 'flex', flexDirection: 'column', gap: '3px' },
  metaLabel: { fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' },
  metaValue: { fontSize: '0.82rem', color: 'var(--text)', fontWeight: '500' },
  errorCard: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '24px', marginBottom: '16px' },
  errorTitle: { fontSize: '1rem', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' },
  errorSub: { fontSize: '0.85rem', color: 'var(--text2)', lineHeight: '1.5', marginBottom: '16px' },
  retryBtn: { background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font)' },
  footer: { textAlign: 'center', fontSize: '0.75rem', color: 'var(--text3)', lineHeight: '1.6', marginTop: '24px' },
}