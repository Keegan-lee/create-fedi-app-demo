'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MultispendDemo } from '../../../components/multispend/MultispendDemo';

export function MultispendDemoClient() {
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
            Multispend
          </h1>
          <p className="max-w-[75ch] text-sm leading-[1.65] text-[var(--color-text-muted)]">
            Fedi&apos;s threshold multi-signature spending for shared Stable Balance funds. No single
            person controls the wallet. A configured number of voters must approve each withdrawal.
          </p>
        </header>

        <div className="space-y-8">
          <section className="space-y-3 rounded-xl px-4 py-3 text-sm leading-[1.65]"
            style={{
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--color-text-muted)',
            }}
          >
            <p>
              <strong className="text-[var(--color-text)]">Why it matters:</strong> Groups (DAOs,
              communities, teams) need shared treasuries without trusting one admin. Multispend
              enforces collective approval before funds move.
            </p>
            <p>
              <strong className="text-[var(--color-text)]">This demo is mocked.</strong> The real
              Multispend API is not yet exposed to mini apps. Votes here use{' '}
              <code className="font-mono text-xs">signEvent()</code> to show how Nostr signatures
              could attest to approvals; execution is simulated locally.
            </p>
          </section>

          <MultispendDemo />

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
              aria-controls="multispend-how-it-works"
            >
              How Multispend works in Fedi
              <span aria-hidden>{howItWorksOpen ? '−' : '+'}</span>
            </button>

            {howItWorksOpen && (
              <div
                id="multispend-how-it-works"
                className="space-y-3 rounded-lg px-4 py-3 text-sm leading-[1.65]"
                style={{
                  background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <p>
                  A group creates a Multispend wallet with up to 21 assigned{' '}
                  <strong className="text-[var(--color-text)]">voters</strong> and an{' '}
                  <strong className="text-[var(--color-text)]">approval threshold</strong> (e.g.
                  2-of-3). Voters and threshold are fixed at creation.
                </p>
                <p>
                  Members deposit into the shared fund. To spend, a member submits a withdrawal
                  request. Voters approve or reject. Once the threshold is met, Fedi processes the
                  withdrawal automatically. Funds move to the requester&apos;s personal wallet.
                </p>
                <p>
                  Mini apps cannot yet create Multispend groups or submit real withdrawal requests.
                  This module demonstrates the approval UX pattern and Nostr-signed votes so you
                  can design flows before the API lands.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
