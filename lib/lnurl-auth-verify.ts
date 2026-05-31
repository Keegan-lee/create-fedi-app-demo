import { schnorr } from '@noble/curves/secp256k1.js';
import { sha256 } from '@noble/hashes/sha256';
import type { NostrEvent } from './fedi-types';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verifies a compact secp256k1 Schnorr signature of SHA256(k1).
 * Used when wallets sign the raw k1 challenge.
 */
export function verifyK1SchnorrSignature(
  k1: string,
  sigHex: string,
  pubkeyHex: string,
): boolean {
  try {
    const k1Bytes = hexToBytes(k1);
    const msg = sha256(k1Bytes);
    const sig = hexToBytes(sigHex);
    const pubkey = hexToBytes(pubkeyHex);
    return schnorr.verify(sig, msg, pubkey);
  } catch {
    return false;
  }
}

/**
 * Verifies a NIP-01 signed event used as an LNURL-auth proof.
 * Expects kind 22242 with a `challenge` tag matching k1.
 */
export function verifyLnurlAuthEvent(k1: string, eventJson: string): {
  valid: boolean;
  pubkey?: string;
  reason?: string;
} {
  let event: NostrEvent;
  try {
    event = JSON.parse(eventJson) as NostrEvent;
  } catch {
    return { valid: false, reason: 'Invalid event JSON' };
  }

  if (event.kind !== 22242) {
    return { valid: false, reason: 'Event must be kind 22242' };
  }

  const challengeTag = event.tags.find((t) => t[0] === 'challenge');
  if (!challengeTag?.[1] || challengeTag[1] !== k1) {
    return { valid: false, reason: 'challenge tag must match k1' };
  }

  const serialized = JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ]);
  const idBytes = sha256(new TextEncoder().encode(serialized));
  const idHex = bytesToHex(idBytes);

  if (idHex !== event.id) {
    return { valid: false, reason: 'Invalid event id' };
  }

  try {
    const sigBytes = hexToBytes(event.sig);
    const valid = schnorr.verify(sigBytes, idBytes, hexToBytes(event.pubkey));
    if (!valid) return { valid: false, reason: 'Invalid signature' };
    return { valid: true, pubkey: event.pubkey };
  } catch {
    return { valid: false, reason: 'Signature verification failed' };
  }
}
