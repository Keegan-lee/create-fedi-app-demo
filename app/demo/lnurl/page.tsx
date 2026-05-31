'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PaymentCallout } from '../../../components/PaymentCallout';
import { LnurlAuth } from '../../../components/lnurl/LnurlAuth';
import { LnurlErrorBoundary } from '../../../components/lnurl/LnurlErrorBoundary';
import { LnurlPay } from '../../../components/lnurl/LnurlPay';
import { LnurlWithdraw } from '../../../components/lnurl/LnurlWithdraw';

export default function LnurlDemoPage() {
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

        <header className="mb-6 space-y-2">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-text)]">
            LNURL
          </h1>
          <p className="max-w-[75ch] text-sm leading-[1.65] text-[var(--color-text-muted)]">
            Encode Lightning interactions as scannable links: pay, authenticate, and withdraw
            without pasting BOLT11 strings manually.
          </p>
        </header>

        <PaymentCallout className="mb-8" />

        <div className="space-y-8">
          <section className="space-y-4">
            <div className="max-w-[75ch] space-y-1.5">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
                LNURL-pay
              </h2>
              <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
                Primary QR uses your configured maintainer LNURL address. Expand the self-hosted
                section to try <code className="font-mono text-xs">/api/lnurlp/[username]</code>{' '}
                callbacks on your own deployment.
              </p>
            </div>
            <LnurlErrorBoundary title="LNURL-pay failed to render">
              <LnurlPay />
            </LnurlErrorBoundary>
          </section>

          <section className="space-y-4">
            <div className="max-w-[75ch] space-y-1.5">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
                LNURL-auth
              </h2>
              <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
                Passwordless login via Lightning wallet or Nostr. This demo signs a kind-22242 event
                with your <code className="font-mono text-xs">challenge</code> tag and completes the
                callback.
              </p>
            </div>
            <LnurlErrorBoundary title="LNURL-auth failed to render">
              <LnurlAuth />
            </LnurlErrorBoundary>
          </section>

          <section className="space-y-4">
            <div className="max-w-[75ch] space-y-1.5">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
                LNURL-withdraw
              </h2>
              <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
                Service pays the user&apos;s invoice. The demo simulates a wallet calling your
                callback with a BOLT11 from <code className="font-mono text-xs">makeInvoice()</code>.
              </p>
            </div>
            <LnurlErrorBoundary title="LNURL-withdraw failed to render">
              <LnurlWithdraw />
            </LnurlErrorBoundary>
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
              aria-controls="lnurl-how-it-works"
            >
              How LNURL works
              <span aria-hidden>{howItWorksOpen ? '−' : '+'}</span>
            </button>

            {howItWorksOpen && (
              <div
                id="lnurl-how-it-works"
                className="space-y-3 rounded-lg px-4 py-3 text-sm leading-[1.65]"
                style={{
                  background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <p>
                  <strong className="text-[var(--color-text)]">LNURL</strong> wraps HTTPS endpoints
                  in bech32 strings (prefix <code className="font-mono text-xs">lnurl1…</code>) so
                  Lightning wallets can scan one QR and discover what to do next.
                </p>
                <p>
                  <strong className="text-[var(--color-text)]">Pay</strong>: metadata at{' '}
                  <code className="font-mono text-xs">/api/lnurlp/user</code>, invoice at the same
                  URL with <code className="font-mono text-xs">?amount=</code> in millisats.
                </p>
                <p>
                  <strong className="text-[var(--color-text)]">Auth</strong>: server issues a{' '}
                  <code className="font-mono text-xs">k1</code> challenge; the wallet proves key
                  ownership via signature or signed Nostr event.
                </p>
                <p>
                  <strong className="text-[var(--color-text)]">Withdraw</strong>: service sends sats
                  to an invoice the user supplies on callback. Replace mock invoices with your node
                  in production and set <code className="font-mono text-xs">LNURL_SERVER_URL</code>{' '}
                  behind a reverse proxy.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
