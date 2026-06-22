'use client';

import Link from 'next/link';
import { useState } from 'react';
import { IdentityBadge } from '../../../components/nostr/IdentityBadge';
import { NostrLogin } from '../../../components/nostr/NostrLogin';
import { SignedMessage } from '../../../components/nostr/SignedMessage';

export default function NostrDemoPage() {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] font-[family-name:var(--font-body)] text-[var(--color-text)]">
      <div
        className="mx-auto w-full max-w-[390px] px-4 pt-6"
        style={{ paddingBottom: 'max(5rem, env(safe-area-inset-bottom, 20px))' }}
      >
        <Link
          href="/demo"
          className="mb-6 inline-block text-xs text-[var(--color-text-muted)] transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-80"
        >
          ← back
        </Link>

        <header className="mb-8 space-y-2">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-text)]">
            Nostr Identity
          </h1>
          <p className="max-w-[75ch] text-sm leading-[1.65] text-[var(--color-text-muted)]">
            Connect with NIP-07 and sign events with your Nostr key. Inside Fedi,{' '}
            <code className="font-mono text-xs">window.nostr</code> is injected automatically. Your
            private key never leaves the app.
          </p>
        </header>

        <div className="space-y-8">
          <section className="space-y-4">
            <div className="max-w-[75ch] space-y-1.5">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
                Identity badge
              </h2>
              <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
                Shows your connected pubkey as a colored avatar and truncated npub. The color is
                derived deterministically from your key. The same pubkey always gets the same color.
              </p>
            </div>
            <IdentityBadge />
          </section>

          <section className="space-y-4">
            <div className="max-w-[75ch] space-y-1.5">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
                Login flow
              </h2>
              <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
                Drop-in auth component for any page. Calls{' '}
                <code className="font-mono text-xs">getPublicKey()</code>. No username, no password,
                no account signup. Your pubkey <em>is</em> your account.
              </p>
            </div>
            <NostrLogin />
          </section>

          <section className="space-y-4">
            <div className="max-w-[75ch] space-y-1.5">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
                Signed message
              </h2>
              <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
                Signs a kind-1 text note via{' '}
                <code className="font-mono text-xs">signEvent()</code>. The returned JSON includes a
                Schnorr signature anyone can verify — then broadcast it to public relays and view it
                live on njump.me.
              </p>
            </div>
            <SignedMessage />
          </section>

          <section className="space-y-3">
            <button
              type="button"
              onClick={() => setHowItWorksOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-semibold transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-80"
              style={{
                background: 'var(--color-surface-1)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                borderRadius: 'var(--radius-lg)',
              }}
              aria-expanded={howItWorksOpen}
              aria-controls="nostr-how-it-works"
            >
              How Nostr identity works
              <span aria-hidden>{howItWorksOpen ? '−' : '+'}</span>
            </button>

            {howItWorksOpen && (
              <div
                id="nostr-how-it-works"
                className="space-y-3 rounded-lg px-4 py-3 text-sm leading-[1.65]"
                style={{
                  background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <p>
                  <strong className="text-[var(--color-text)]">Nostr</strong> is a decentralized
                  protocol where identity is a cryptographic keypair. Your public key (shown as{' '}
                  <code className="font-mono text-xs">npub1…</code>) is a stable, unique identifier.
                </p>
                <p>
                  Fedi injects a NIP-07 provider at{' '}
                  <code className="font-mono text-xs">window.nostr</code> before your page loads. The
                  mini app can read your pubkey and request signatures, but never sees your private
                  key.
                </p>
                <p>
                  <code className="font-mono text-xs">getPublicKey()</code> is safe for login flows.
                  It only reads your identity. To prove you control a key, call{' '}
                  <code className="font-mono text-xs">signEvent()</code> and verify the signature
                  server-side (NIP-98 HTTP auth uses kind 27235 for this).
                </p>
                <p>
                  Outside Fedi, <code className="font-mono text-xs">window.nostr</code> is undefined.
                  In development, this project uses a mock provider with a well-known test keypair so
                  you can build and test locally.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
