'use client';

import Link from 'next/link';
import { useState } from 'react';
import { NostrFeedProvider } from '../../../components/nostr/NostrFeedProvider';
import { NoteFeed } from '../../../components/nostr/NoteFeed';
import { PublishNote } from '../../../components/nostr/PublishNote';
import { DEFAULT_RELAYS } from '../../../lib/nostr/relay';

export function NostrFeedDemoClient() {
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
            Nostr feed
          </h1>
          <p className="max-w-[75ch] text-sm leading-[1.65] text-[var(--color-text-muted)]">
            Read and post kind-1 notes on public relays. Zaps combine WebLN payments with NIP-57
            zap receipts published back to the relay.
          </p>
        </header>

        <NostrFeedProvider>
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
                Connected to{' '}
                <span className="font-mono text-xs text-[var(--color-text)]">
                  {DEFAULT_RELAYS.join(', ')}
                </span>
                . Override with{' '}
                <code className="font-mono text-xs">NEXT_PUBLIC_NOSTR_RELAY</code> (comma-separated
                URLs).
              </p>
            </section>

            <section className="space-y-4">
              <div className="max-w-[75ch] space-y-1.5">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
                  Publish
                </h2>
                <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
                  Signs a kind-1 text note with your NIP-07 key and publishes to relays.
                </p>
              </div>
              <PublishNote />
            </section>

            <section className="space-y-4">
              <div className="max-w-[75ch] space-y-1.5">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
                  Live feed
                </h2>
                <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
                  Subscribes to recent notes from the last 24 hours, then streams new events.
                </p>
              </div>
              <NoteFeed />
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
                aria-controls="nostr-feed-how-it-works"
              >
                How the feed works
                <span aria-hidden>{howItWorksOpen ? '−' : '+'}</span>
              </button>

              {howItWorksOpen && (
                <div
                  id="nostr-feed-how-it-works"
                  className="space-y-3 rounded-lg px-4 py-3 text-sm leading-[1.65]"
                  style={{
                    background: 'var(--color-surface-1)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-muted)',
                    borderRadius: 'var(--radius-lg)',
                  }}
                >
                  <p>
                    <strong className="text-[var(--color-text)]">Relays</strong> are WebSocket
                    servers that store and forward Nostr events. This demo uses{' '}
                    <code className="font-mono text-xs">nostr-tools</code> with reconnect and
                    heartbeat pings.
                  </p>
                  <p>
                    <strong className="text-[var(--color-text)]">Zaps (NIP-57)</strong> look up the
                    author&apos;s <code className="font-mono text-xs">lud16</code> from their
                    profile, request a Lightning invoice with a signed zap request, pay via WebLN,
                    then publish a kind-9735 zap receipt.
                  </p>
                  <p>
                    Zaps only work when the note author has a Lightning address configured and
                    WebLN is available in Fedi.
                  </p>
                </div>
              )}
            </section>
          </div>
        </NostrFeedProvider>
      </div>
    </div>
  );
}
