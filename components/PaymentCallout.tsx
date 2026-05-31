'use client';

import {
  getPublicLnurlPayAddress,
  PUBLIC_FEDI_APP_REPO,
  truncateLnurl,
} from '../lib/payment-config';

interface IPaymentCalloutProps {
  className?: string;
}

/**
 * Explains that demo Lightning payments route to the create-fedi-app maintainer wallet.
 */
export function PaymentCallout({ className }: IPaymentCalloutProps) {
  const lnurl = getPublicLnurlPayAddress();

  return (
    <div
      className={`space-y-2 rounded-lg px-4 py-3 text-sm leading-[1.65] ${className ?? ''}`}
      style={{
        background: 'var(--color-accent-dim)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--color-text-muted)',
      }}
      role="note"
    >
      <p className="font-semibold" style={{ color: 'var(--color-accent)' }}>
        Demo payments support create-fedi-app
      </p>
      <p>
        Lightning sent in these demos goes to the maintainer test wallet so you can verify real
        payment flows inside Fedi.
      </p>
      <p className="font-mono text-xs break-all" style={{ color: 'var(--color-text-subtle)' }}>
        {truncateLnurl(lnurl)}
      </p>
      <p>
        If this template helped you, please{' '}
        <a
          href={PUBLIC_FEDI_APP_REPO}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-accent)' }}
        >
          star, fork, or like the repo
        </a>
        .
      </p>
    </div>
  );
}
