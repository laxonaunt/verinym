import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RpcProvider } from 'starknet'
import toast from 'react-hot-toast'

const PROOF_VERIFIER_ADDRESS = '0x066d578e0b372de4cf87b90fd4eff2c740d92d7d0622d6110b30da8649b0941b'
const ALCHEMY_RPC = 'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/FyJ2KCJhRiV4Bm-_JfuFY'

export default function SubmitProof() {
  const navigate = useNavigate()
  const [proof, setProof] = useState(null)
  const [status, setStatus] = useState('idle')
  const [verificationId, setVerificationId] = useState(null)
  const [txHash, setTxHash] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem('verinym_proof')
    if (!saved) { navigate('/generate'); return }
    setProof(JSON.parse(saved))
  }, [])

  async function submit() {
    if (!window.starknet?.isConnected || !window.starknet?.selectedAddress) {
      toast.error('Connect your wallet first')
      return
    }

    setStatus('submitting')

    try {
      const provider = new RpcProvider({ nodeUrl: ALCHEMY_RPC })
      const starknetAccount = window.starknet.account

      toast('Please confirm in your wallet', { icon: '⏳' })

      const result = await starknetAccount.execute({
        contractAddress: PROOF_VERIFIER_ADDRESS,
        entrypoint: 'submit_proof',
        calldata: [
          proof.proofHash,
          proof.publicInputs.issuerPublicKey,
          proof.publicInputs.fieldOfWork,
          proof.publicInputs.minYearsClaimed.toString(),
          proof.publicInputs.currentTimestamp.toString(),
          proof.signature.r,
          proof.signature.s,
        ],
      })

      toast('Waiting for confirmation...', { icon: '⏳' })

      const receipt = await provider.waitForTransaction(result.transaction_hash)
      setTxHash(result.transaction_hash)

      console.log('Full receipt:', JSON.stringify(receipt, null, 2))
      console.log('Events:', receipt.events)

     
setVerificationId(result.transaction_hash)
      setStatus('done')
      toast.success('Proof verified on-chain')

    } catch (err) {
      console.error('Full error:', err)
      setStatus('error')
      if (err.message?.includes('user rejected')) {
        setStatus('idle')
        toast.error('Rejected in wallet')
        return
      }
      toast.error(err.message?.slice(0, 100) ?? 'Submission failed')
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/verify/${verificationId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!proof) return null

  return (
    <div>
      <p style={s.eyebrow}>Step 4 of 4</p>
      <h1 style={s.title}>Submit Proof</h1>
      <p style={s.sub}>
        Your proof will be verified by the smart contract and permanently recorded on-chain.
        No personal data is included.
      </p>

      <div style={s.card}>
        <div style={s.cardHeader}>Proof Summary</div>
        {[
          ['Claim', `${proof.publicInputs.minYearsClaimed}+ years in ${proof.publicInputs.fieldOfWorkLabel}`],
          ['Proof Hash', proof.proofHash.slice(0, 18) + '...'],
          ['Network', 'Starknet Sepolia Testnet'],
          ['Personal Data', 'None — Zero-Knowledge'],
        ].map(([label, value]) => (
          <div key={label} style={s.row}>
            <span style={s.rowLabel}>{label}</span>
            <span style={{
              ...s.rowValue,
              ...(label === 'Personal Data' ? { color: 'var(--green)' } : {}),
              ...(label === 'Proof Hash' ? { fontFamily: 'var(--mono)', fontSize: '0.78rem' } : {}),
            }}>{value}</span>
          </div>
        ))}
      </div>

      {(status === 'idle' || status === 'error') && (
        <button onClick={submit} style={s.btn}>
          {status === 'error' ? 'Try Again' : 'Submit to Starknet'}
        </button>
      )}

      {status === 'submitting' && (
        <div style={s.loadingBox}>
          <div style={s.spinner} />
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
            Submitting to Starknet — confirm in your wallet
          </p>
        </div>
      )}

      {status === 'done' && verificationId && (
        <div style={s.successCard}>
          <div style={s.successHeader}>
            <div style={s.successDot} />
            <span style={s.successTitle}>Proof Verified On-Chain</span>
          </div>
          <p style={s.successSub}>
            Your claim is permanently recorded on Starknet Sepolia. Share this link:
          </p>
          <div style={s.linkRow}>
            <span style={s.linkText}>
              {window.location.origin}/verify/{verificationId.slice(0, 16)}...
            </span>
            <button onClick={copyLink} style={s.copyBtn}>
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>
          {txHash && (
            
             <a href={`let actualVerificationIdhttps://sepolia.starkscan.co/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={s.txLink}
            >
              View transaction on Starkscan
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px' }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  )
}

const s = {
  eyebrow: { fontSize: '0.75rem', color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' },
  title: { fontSize: '1.75rem', fontWeight: '600', letterSpacing: '-0.03em', marginBottom: '10px' },
  sub: { color: 'var(--text2)', fontSize: '0.9rem', lineHeight: '1.65', marginBottom: '28px', maxWidth: '480px' },
  card: { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '24px' },
  cardHeader: { padding: '12px 16px', fontSize: '0.75rem', fontWeight: '500', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)', background: 'var(--bg3)', fontFamily: 'var(--mono)' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' },
  rowLabel: { fontSize: '0.85rem', color: 'var(--text2)' },
  rowValue: { fontSize: '0.85rem', color: 'var(--text)', fontWeight: '500' },
  btn: { width: '100%', padding: '13px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font)' },
  loadingBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '10px' },
  spinner: { width: '24px', height: '24px', border: '2px solid var(--border2)', borderTop: '2px solid var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  successCard: { background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: '10px', padding: '20px' },
  successHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  successDot: { width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' },
  successTitle: { fontSize: '1rem', fontWeight: '600', color: 'var(--green)' },
  successSub: { fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '16px', lineHeight: '1.5' },
  linkRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px', gap: '12px' },
  linkText: { fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  copyBtn: { background: 'var(--green)', color: '#000', border: 'none', borderRadius: '4px', padding: '5px 12px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font)' },
  txLink: { display: 'inline-flex', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text3)', textDecoration: 'none' },
}