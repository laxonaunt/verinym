import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function WalletConnect() {
  const [account, setAccount] = useState(null)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    if (window.starknet?.isConnected) {
      setAccount(window.starknet.selectedAddress)
    }
  }, [])

  async function connect() {
    if (!window.starknet) {
      toast.error('Install ArgentX or Braavos wallet to continue')
      window.open('https://www.argent.xyz/argent-x/', '_blank')
      return
    }
    setConnecting(true)
    try {
      await window.starknet.enable()
      setAccount(window.starknet.selectedAddress)
      toast.success('Wallet connected')
    } catch {
      toast.error('Connection cancelled')
    } finally {
      setConnecting(false)
    }
  }

  const short = addr => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''

  if (account) return (
    <div style={s.pill}>
      <div style={s.dot} />
      <span style={s.addr}>{short(account)}</span>
      <button onClick={() => setAccount(null)} style={s.disconnect}>Disconnect</button>
    </div>
  )

  return (
    <button onClick={connect} disabled={connecting} style={s.btn}>
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}

const s = {
  btn: {
    background: 'var(--green)',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '0.85rem',
    fontWeight: '600',
    fontFamily: 'var(--font)',
    cursor: 'pointer',
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--bg2)',
    border: '1px solid var(--border2)',
    borderRadius: '6px',
    padding: '6px 12px',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--green)',
  },
  addr: {
    fontFamily: 'var(--mono)',
    fontSize: '0.8rem',
    color: 'var(--text2)',
  },
  disconnect: {
    background: 'none',
    border: 'none',
    color: 'var(--text3)',
    fontSize: '0.75rem',
    cursor: 'pointer',
    padding: '0 0 0 4px',
    fontFamily: 'var(--font)',
  },
}
