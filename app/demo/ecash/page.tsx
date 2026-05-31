'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BalanceDisplay } from '../../../components/fedi/BalanceDisplay';
import { FediVersionBadge } from '../../../components/fedi/FediVersionBadge';
import type { IInstallMiniAppProps } from '../../../components/fedi/InstallMiniAppButton';

const DEFAULT_INSTALL_APP: IInstallMiniAppProps = {
  id: 'com.create-fedi-app.demo',
  title: process.env.NEXT_PUBLIC_APP_NAME ?? 'Fedi Demo App',
  url: 'https://example.com',
  description: 'Sample mini app entry for the ecash-balance demo.',
};

export default function EcashDemoPage() {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [installApp, setInstallApp] = useState<IInstallMiniAppProps>(DEFAULT_INSTALL_APP);

  useEffect(() => {
    setInstallApp((prev) => ({ ...prev, url: window.location.origin }));
  }, []);

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] font-[family-name:var(--font-body)] text-[var(--color-text)]">
      <div
        className="mx-auto w-full max-w-[390px] px-4 pt-6"
        style={{ paddingBottom: 'max(5rem, env(safe-area-inset-bottom, 20px))' }}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/demo"
            className="inline-block text-xs text-[var(--color-text-muted)] transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-80"
          >
            ← back
          </Link>
          <FediVersionBadge />
        </div>

        <header className="mb-8 space-y-2">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-text)]">
            Ecash &amp; Fedi API
          </h1>
          <p className="max-w-[75ch] text-sm leading-[1.65] text-[var(--color-text-muted)]">
            Reads <code className="font-mono text-xs">window.fediInternal</code> for versioned mini
            app discovery. Unlike WebLN and Nostr, this API is optional. Older Fedi builds may not
            expose it.
          </p>
        </header>

        <div className="space-y-8">
          <section className="space-y-4">
            <div className="max-w-[75ch] space-y-1.5">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
                Environment &amp; installed apps
              </h2>
              <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
                On fediInternal v2, tap <strong className="text-[var(--color-text)]">Load installed apps</strong>{' '}
                to list mini app URLs or use{' '}
                <code className="font-mono text-xs">installMiniApp()</code> to trigger Fedi&apos;s
                native install sheet. Both require the user to grant{' '}
                <code className="font-mono text-xs">manageInstalledMiniApps</code> when Fedi prompts.
              </p>
            </div>
            <BalanceDisplay installApp={installApp} />
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
              aria-controls="ecash-how-it-works"
            >
              How fediInternal works
              <span aria-hidden>{howItWorksOpen ? '−' : '+'}</span>
            </button>

            {howItWorksOpen && (
              <div
                id="ecash-how-it-works"
                className="space-y-3 rounded-lg px-4 py-3 text-sm leading-[1.65]"
                style={{
                  background: 'var(--color-surface-1)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                  borderRadius: 'var(--radius-lg)',
                }}
              >
                <p>
                  <strong className="text-[var(--color-text)]">fediInternal</strong> is a versioned
                  bridge for mini app discovery inside Fedi. Version{' '}
                  <code className="font-mono text-xs">0</code> and{' '}
                  <code className="font-mono text-xs">1</code> only expose the version number;{' '}
                  <code className="font-mono text-xs">2</code> adds{' '}
                  <code className="font-mono text-xs">getInstalledMiniApps()</code> and{' '}
                  <code className="font-mono text-xs">installMiniApp()</code>.
                </p>
                <p>
                  Always check both presence and version before calling methods. Outside Fedi (or on
                  very old builds), <code className="font-mono text-xs">window.fediInternal</code> is{' '}
                  <code className="font-mono text-xs">undefined</code>. Show an &quot;Open in
                  Fedi&quot; prompt instead of failing silently.
                </p>
                <p>
                  <code className="font-mono text-xs">getInstalledMiniApps()</code> and{' '}
                  <code className="font-mono text-xs">installMiniApp()</code> require Fedi&apos;s{' '}
                  <code className="font-mono text-xs">manageInstalledMiniApps</code> permission. Call
                  them only after a user taps a button — Fedi shows Allow/Deny on first use. If the
                  user denies with &quot;Remember my choice&quot;, reset the permission in Fedi mini
                  app settings before retrying.
                </p>
                <p>
                  Use <code className="font-mono text-xs">installMiniApp()</code> to suggest
                  companion apps to your users. Fedi shows a native confirmation sheet; your mini app
                  never writes to the user&apos;s home screen directly.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
