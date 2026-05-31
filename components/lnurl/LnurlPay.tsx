'use client';

import { useMemo, useState } from 'react';
import { getPublicLnurlPayAddress } from '../../lib/payment-config';
import { encodeLnurl } from '../../lib/lnurl-utils';
import { LnurlQR } from './LnurlQR';

interface ILnurlPayProps {
  /** Username segment in `/api/lnurlp/[username]` for the self-hosted demo. */
  username?: string;
  /** Optional override for the public origin of the self-hosted endpoint. */
  baseUrl?: string;
  className?: string;
}

/**
 * Displays the configured maintainer LNURL-pay address and an optional self-hosted demo endpoint.
 */
export function LnurlPay({ username = 'demo-user', baseUrl, className }: ILnurlPayProps) {
  const [selfHostedOpen, setSelfHostedOpen] = useState(false);
  const maintainerLnurl = getPublicLnurlPayAddress();

  const selfHostedPayUrl = useMemo(() => {
    if (!selfHostedOpen) return '';
    const origin =
      baseUrl?.replace(/\/$/, '') ??
      (typeof window !== 'undefined' ? window.location.origin : '');
    if (!origin) return '';
    return `${origin}/api/lnurlp/${encodeURIComponent(username)}`;
  }, [username, baseUrl, selfHostedOpen]);

  const selfHostedLnurl = useMemo(() => {
    if (!selfHostedPayUrl) return '';
    try {
      return encodeLnurl(selfHostedPayUrl);
    } catch {
      return '';
    }
  }, [selfHostedPayUrl]);

  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      <LnurlQR value={maintainerLnurl} label="Maintainer LNURL-pay QR" />

      <p className="text-center text-xs leading-[1.65]" style={{ color: 'var(--color-text-subtle)' }}>
        Scan to pay the create-fedi-app maintainer test wallet. Amount is chosen by your wallet
        within the LNURL min/max range.
      </p>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setSelfHostedOpen((open) => !open)}
          className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-semibold transition-opacity duration-200 hover:opacity-80"
          style={{
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            borderRadius: 'var(--radius-lg)',
          }}
          aria-expanded={selfHostedOpen}
        >
          Self-hosted LNURL-pay demo
          <span aria-hidden>{selfHostedOpen ? '−' : '+'}</span>
        </button>

        {selfHostedOpen && (
          <div className="space-y-3">
            <p className="text-xs leading-[1.65]" style={{ color: 'var(--color-text-muted)' }}>
              This endpoint lives on your app at{' '}
              <code className="font-mono text-xs">/api/lnurlp/{username}</code>. Set{' '}
              <code className="font-mono text-xs">LNURL_SERVER_URL</code> when running inside Fedi
              so external wallets can reach your callback.
            </p>
            {selfHostedLnurl ? (
              <LnurlQR value={selfHostedLnurl} label={`Self-hosted LNURL-pay for @${username}`} />
            ) : (
              <p className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
                Open this section in the browser to generate the self-hosted LNURL.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
