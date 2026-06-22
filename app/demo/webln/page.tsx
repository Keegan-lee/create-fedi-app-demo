'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { PaymentCallout } from '../../../components/PaymentCallout';
import { PayButton } from '../../../components/webln/PayButton';
import { InvoiceCard } from '../../../components/webln/InvoiceCard';
import { PaymentHistory } from '../../../components/webln/PaymentHistory';
import { usePaymentFlow } from '../../../hooks/usePaymentFlow';
import { addPaymentRecord } from '../../../lib/payment-history';
import { getDemoWeblnSats } from '../../../lib/payment-config';

const DEMO_SATS = getDemoWeblnSats();
const DEMO_MEMO = 'create-fedi-app demo';

export default function WeblnDemoPage() {
  const { recordReceivedPayment } = usePaymentFlow();
  const [demoInvoice, setDemoInvoice] = useState('');
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  const handleInvoiceReady = useCallback((invoice: string) => {
    setDemoInvoice(invoice);
  }, []);

  function handlePaySuccess(preimage: string) {
    addPaymentRecord({
      amountSats: DEMO_SATS,
      memo: DEMO_MEMO,
      timestamp: Date.now(),
      preimage,
      type: 'send',
    });
  }

  function handleInvoicePaid(preimage: string) {
    recordReceivedPayment({
      amountSats: DEMO_SATS,
      memo: DEMO_MEMO,
      preimage,
    });
  }

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
            WebLN Payments
          </h1>
          <p className="max-w-[75ch] text-sm leading-[1.65] text-[var(--color-text-muted)]">
            Send and receive Lightning payments through the WebLN browser API. Connect your wallet
            with the buttons below — nothing prompts until you tap.
          </p>
        </header>

        <PaymentCallout className="mb-8" />

        <div className="space-y-8">
          <section className="space-y-4">
            <div className="max-w-[75ch] space-y-1.5">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
                Generate Invoice to Pay
              </h2>
              <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
                Tap create invoice to call <code className="font-mono text-xs">makeInvoice()</code>.
                This produces a BOLT11 request you (or someone else) can pay — scan the QR code, copy
                the string, or pay it from the section below.
              </p>
            </div>
            <InvoiceCard
              sats={DEMO_SATS}
              memo={DEMO_MEMO}
              onInvoice={handleInvoiceReady}
              onPaid={handleInvoicePaid}
            />
          </section>

          <section className="space-y-4">
            <div className="max-w-[75ch] space-y-1.5">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
                Send payment
              </h2>
              <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
                Pays the invoice above via <code className="font-mono text-xs">sendPayment()</code>.
                The preimage returned is cryptographic proof that payment completed.
              </p>
            </div>
            {demoInvoice ? (
              <PayButton
                invoice={demoInvoice}
                amountSats={DEMO_SATS}
                memo={DEMO_MEMO}
                onSuccess={handlePaySuccess}
              />
            ) : (
              <p className="text-sm text-[var(--color-text-subtle)]">
                Create an invoice above, then pay it here.
              </p>
            )}
          </section>

          <section className="space-y-4">
            <div className="max-w-[75ch] space-y-1.5">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
                Payment history
              </h2>
              <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
                Recent payments stored in your browser. Useful for demos, not a substitute for
                server-side records in production.
              </p>
            </div>
            <PaymentHistory />
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
              aria-controls="webln-how-it-works"
            >
              How this works
              <span aria-hidden>{howItWorksOpen ? '−' : '+'}</span>
            </button>

            {howItWorksOpen && (
              <div
                id="webln-how-it-works"
                className="space-y-3 rounded-lg px-4 py-3 text-sm leading-[1.65]"
                style={{
                  background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <p>
                  <strong style={{ color: 'var(--color-text)' }}>WebLN</strong> is a JavaScript
                  standard that lets web apps talk to a Lightning wallet. Fedi injects{' '}
                  <code className="font-mono text-xs">window.webln</code> into every Mini App
                  WebView before your page loads.
                </p>
                <p>
                  To send sats, call <code className="font-mono text-xs">sendPayment(invoice)</code>{' '}
                  with a BOLT11 string. To receive, call{' '}
                  <code className="font-mono text-xs">makeInvoice({'{ amount, defaultMemo }'})</code>{' '}
                  and share the returned payment request.
                </p>
                <p>
                  On success, <code className="font-mono text-xs">sendPayment</code> returns a{' '}
                  <strong style={{ color: 'var(--color-text)' }}>preimage</strong>, a 32-byte hex
                  string that proves the payment happened. Your server can verify it before
                  unlocking content or granting access.
                </p>
                <p>
                  Outside Fedi, <code className="font-mono text-xs">window.webln</code> is undefined.
                  In development, this project uses a mock provider so you can test flows locally.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
