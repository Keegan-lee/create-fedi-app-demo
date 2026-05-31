import Link from 'next/link';
import { demoRoutes } from '../../lib/demo-routes';

export default function DemoPage() {
  return (
    <main
      className="mx-auto min-h-dvh w-full max-w-[390px] px-4 pt-6 pb-20"
      style={{ paddingBottom: 'max(5rem, env(safe-area-inset-bottom, 20px))' }}
    >
      <Link
        href="/"
        className="mb-6 inline-block text-xs text-[var(--color-text-muted)] transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-80"
      >
        ← back
      </Link>

      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--color-text)]">
            Demos
          </h1>
          <p className="max-w-[75ch] text-sm leading-[1.65] text-[var(--color-text-muted)]">
            Interactive examples for each module in your project. Use the dev toolbar to toggle
            mock WebLN and Nostr providers outside the Fedi app.
          </p>
        </div>

        {demoRoutes.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No demo routes configured.</p>
        ) : (
          <ul className="space-y-3">
            {demoRoutes.map((route) => (
              <li key={route.href}>
                <Link
                  href={route.href}
                  className="block rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-1)] p-4 transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-90 active:opacity-80"
                >
                  <span className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-text)]">
                    {route.title}
                  </span>
                  <span className="mt-1 block text-sm leading-[1.65] text-[var(--color-text-muted)]">
                    {route.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
