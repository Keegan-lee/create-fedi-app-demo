import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { PaymentCallout } from '../../../components/PaymentCallout';
import { PayGate } from '../../../components/payment-gated/PayGate';
import { checkPaymentAccess } from '../../../lib/payment-gate';
import { getDemoGateSats } from '../../../lib/payment-config';

export const metadata: Metadata = {
  title: 'Payment Gate',
  description:
    'Demo of Lightning paywalled content: preview an article for free, pay sats to unlock the full text, and keep access via a signed payment cookie.',
  openGraph: {
    title: 'Payment Gate',
    description:
      'Demo of Lightning paywalled content: preview an article for free, pay sats to unlock the full text, and keep access via a signed payment cookie.',
  },
  twitter: {
    card: 'summary',
    title: 'Payment Gate',
    description:
      'Demo of Lightning paywalled content: preview an article for free, pay sats to unlock the full text, and keep access via a signed payment cookie.',
  },
};

const CONTENT_ID = 'demo-article';
const PRICE_SATS = getDemoGateSats();

const ARTICLE_PREVIEW = (
  <article className="space-y-3 px-1 py-2">
    <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-text)]">
      Why sats unlock content
    </h2>
    <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
      Lightning payments settle in seconds with cryptographic proof. A preimage returned from{' '}
      <code className="font-mono text-xs">sendPayment()</code> is enough for your server to grant
      access without accounts or passwords.
    </p>
    <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
      This preview shows the opening paragraphs. Pay a small amount of sats to read the rest and
      test the full paywall flow inside Fedi…
    </p>
  </article>
);

const ARTICLE_FULL = (
  <article className="space-y-4">
    <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-text)]">
      Why sats unlock content
    </h2>
    <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
      Lightning payments settle in seconds with cryptographic proof. A preimage returned from{' '}
      <code className="font-mono text-xs">sendPayment()</code> is enough for your server to grant
      access without accounts or passwords.
    </p>
    <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
      In this template, your app requests a real BOLT11 invoice from the configured LNURL-pay
      address, stores the invoice payment hash, and verifies the preimage after{' '}
      <code className="font-mono text-xs">sendPayment()</code> completes. The server sets an
      HttpOnly cookie signed with HMAC once verification succeeds.
    </p>
    <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
      <code className="font-mono text-xs">proxy.ts</code> runs before protected routes such as{' '}
      <code className="font-mono text-xs">/demo/payment-gated/article</code>. If the cookie is
      missing or invalid, the request is redirected back here. That keeps direct URL access gated
      even when someone bypasses the React paywall UI.
    </p>
    <Link
      href="/demo/payment-gated/article"
      className="inline-block text-sm font-semibold transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-80"
      style={{ color: 'var(--color-accent)' }}
    >
      Open proxy-protected article →
    </Link>
  </article>
);

export default async function PaymentGatedDemoPage() {
  const cookieStore = await cookies();
  const hasAccess = await checkPaymentAccess(cookieStore, CONTENT_ID);

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
            Payment-gated content
          </h1>
          <p className="max-w-[75ch] text-sm leading-[1.65] text-[var(--color-text-muted)]">
            Lock articles, downloads, or API responses behind a one-time Lightning payment. Access
            persists in a signed cookie after verification.
          </p>
        </header>

        <PaymentCallout className="mb-8" />

        {hasAccess ? (
          <div className="space-y-4">
            <div
              className="rounded-lg px-3 py-2 text-xs font-semibold"
              style={{
                background: 'var(--color-accent-dim)',
                color: 'var(--color-accent)',
                borderRadius: 'var(--radius-md)',
              }}
              role="status"
            >
              Unlocked: payment verified
            </div>
            {ARTICLE_FULL}
          </div>
        ) : (
          <PayGate
            contentId={CONTENT_ID}
            priceSats={PRICE_SATS}
            memo="Unlock demo article"
            preview={ARTICLE_PREVIEW}
          />
        )}
      </div>
    </div>
  );
}
