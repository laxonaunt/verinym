# Verinym — Private Credential Verification on Starknet

> Prove your experience. Reveal nothing else.

## What is Verinym?

Verinym lets anyone prove professional credentials without exposing their identity. 
A user can prove "I have 3+ years of engineering experience" and share a verifiable 
on-chain link — without revealing their name, employer, or wallet address.

## Live Demo

🔗 (https://verinym.vercel.app/(currently desktop friendly))

🎥(https://youtu.be/CavJ0jRQ6do?si=jbNJkAckLQSlG6KB)

## How it works

1. **Upload** — Load your credential JSON file (stays on your device)
2. **Select Claim** — Choose the minimum experience threshold to prove
3. **Generate Proof** — Proof is generated entirely in your browser
4. **Submit** — Proof is verified on Starknet and a shareable link is created

## Tech Stack

- **Cairo** — Smart contracts on Starknet Sepolia
- **Noir** — Zero-knowledge circuit for credential verification
- **React** — Frontend
- **StarknetJS** — Blockchain interaction

## Deployed Contracts (Starknet Sepolia)

| Contract | Address |
|---|---|
| IssuerRegistry | `0x01c6ae14edfdb8f86920afa4d5e7b872cb8bcbdeeef29c2b8c40a664a450d4c8` |
| ProofVerifier | `0x066d578e0b372de4cf87b90fd4eff2c740d92d7d0622d6110b30da8649b0941b` |

## Privacy Properties

- No personal data stored on-chain
- No identity revealed to verifier
- No wallet address linked to credential
- Credential never leaves user's device



## Roadmap

- [ ] Become the default trust layer for professional credentials across Starknet
- [ ] Open issuer registry — every university, company and institution on-chain
- [ ] Verinym SDK embedded in every hiring platform, DAO and grant system
- [ ] Zero personal data, zero friction — verify anything, reveal nothing
- [ ] The credential standard for Web3