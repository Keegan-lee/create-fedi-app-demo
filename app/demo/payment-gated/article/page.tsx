import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { checkPaymentAccess } from '../../../../lib/payment-gate';
import { PUBLIC_FEDI_APP_REPO } from '../../../../lib/payment-config';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Gated Article',
  description:
    'Proxy-protected article unlocked after a real Lightning payment. Thanks for testing create-fedi-app.',
  openGraph: {
    title: 'Gated Article',
    description:
      'Proxy-protected article unlocked after a real Lightning payment. Thanks for testing create-fedi-app.',
  },
  twitter: {
    card: 'summary',
    title: 'Gated Article',
    description:
      'Proxy-protected article unlocked after a real Lightning payment. Thanks for testing create-fedi-app.',
  },
};

const CONTENT_ID = 'demo-article';

export default async function ProtectedArticlePage() {
  const cookieStore = await cookies();
  const hasAccess = await checkPaymentAccess(cookieStore, CONTENT_ID);

  if (!hasAccess) {
    redirect('/demo/payment-gated?redirect=/demo/payment-gated/article');
  }

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] font-[family-name:var(--font-body)] text-[var(--color-text)]">
      <div
        className="mx-auto w-full max-w-[390px] px-4 pt-6"
        style={{ paddingBottom: 'max(5rem, env(safe-area-inset-bottom, 20px))' }}
      >
        <Link
          href="/demo/payment-gated"
          className="mb-6 inline-block text-xs text-[var(--color-text-muted)] transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-80"
        >
          ← back to demo
        </Link>

        <header className="mb-6 space-y-2">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-text)]">
            Unlocked content
          </h1>
          <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
            You paid a real Lightning invoice and passed both client verification and the proxy
            cookie check.
          </p>
        </header>

        <article className="space-y-4 text-sm leading-[1.65] text-[var(--color-text-muted)]">
          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-text)]">
              How this paywall works
            </h2>
            <p>
              When you tapped unlock, the app fetched a BOLT11 invoice from the configured LNURL-pay
              address. Your wallet returned a preimage after payment; the server verified{' '}
              <code className="font-mono text-xs">sha256(preimage)</code> against the invoice
              payment hash and issued a signed HttpOnly cookie.
            </p>
            <p>
              <code className="font-mono text-xs">proxy.ts</code> enforces the same cookie at the
              network boundary, so this route stays protected even if someone tampers with client
              code.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-text)]">
              Production tips
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Swap the in-memory payment store for your database module.</li>
              <li>Rotate <code className="font-mono text-xs">PAYMENT_GATE_SECRET</code> via Doppler.</li>
              <li>Point <code className="font-mono text-xs">LNURL_PAY_ADDRESS</code> at your own wallet.</li>
              <li>Keep amounts small for testing; raise limits only when you are ready.</li>
            </ul>
          </section>

          <section
            className="space-y-3 rounded-lg px-4 py-4"
            style={{
              background: 'var(--color-accent-dim)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--color-accent)]">
              Thanks for testing!
            </h2>
            <p style={{ color: 'var(--color-text-muted)' }}>
              If create-fedi-app helped you ship a Fedi mini app faster, please support the project
              on GitHub — star, fork, or like the public repo so other builders can find it.
            </p>
            <a
              href={PUBLIC_FEDI_APP_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity duration-200 hover:opacity-90"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-primary-foreground)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              Open public-fedi-app on GitHub →
            </a>
          </section>
        </article>
      </div>
    </div>
  );
}
