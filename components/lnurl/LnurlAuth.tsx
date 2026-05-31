'use client';

import { useCallback, useEffect, useState } from 'react';
import { useIdentity } from '../../lib/nostr';
import { encodeLnurl } from '../../lib/lnurl-utils';
import { LnurlQR } from './LnurlQR';

type TAuthChallenge = {
  tag: string;
  k1: string;
  lnurl: string;
  url: string;
};

type TAuthResult = {
  status: string;
  pubkey?: string;
  reason?: string;
};

/**
 * Demo LNURL-auth flow: fetches a k1 challenge, shows QR, and completes login via Nostr.
 */
export function LnurlAuth({ className }: { className?: string }) {
  const { signEvent, getPublicKey, pubkey } = useIdentity();
  const [challenge, setChallenge] = useState<TAuthChallenge | null>(null);
  const [result, setResult] = useState<TAuthResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const loadChallenge = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/lnurlauth');
      if (!res.ok) throw new Error('Failed to load auth challenge');
      const data = (await res.json()) as TAuthChallenge;
      setChallenge(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load challenge');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChallenge();
  }, [loadChallenge]);

  async function handleLogin() {
    if (!challenge) return;
    setIsAuthenticating(true);
    setError(null);

    try {
      const pk = pubkey ?? (await getPublicKey());
      if (!pk) {
        setError('Nostr provider not available. Open inside Fedi to sign the challenge.');
        return;
      }

      const unsigned = {
        kind: 22242,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['challenge', challenge.k1]],
        content: '',
      };

      const signed = await signEvent(unsigned);
      if (!signed) {
        setError('Signing failed');
        return;
      }

      const res = await fetch('/api/lnurlauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          k1: challenge.k1,
          key: pk,
          tag: 'login',
          event: signed,
        }),
      });
      const data = (await res.json()) as TAuthResult;
      setResult(data);

      if (data.status !== 'OK') {
        setError(data.reason ?? 'Authentication failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  }

  const lnurl = challenge?.lnurl ?? (challenge?.url ? encodeLnurl(challenge.url) : '');

  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      {isLoading && (
        <p className="text-sm" style={{ color: 'var(--color-text-subtle)' }} aria-live="polite">
          Loading challenge…
        </p>
      )}

      {challenge && lnurl && <LnurlQR value={lnurl} label="LNURL-auth QR code" />}

      <button
        type="button"
        onClick={handleLogin}
        disabled={!challenge || isAuthenticating}
        className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-90 active:opacity-80 disabled:opacity-50"
        style={{
          background: 'var(--color-accent)',
          color: 'var(--color-primary-foreground)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {isAuthenticating ? 'Signing…' : 'Complete login (Nostr)'}
      </button>

      <button
        type="button"
        onClick={() => void loadChallenge()}
        className="w-full text-xs transition-opacity duration-200 hover:opacity-80"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Refresh challenge
      </button>

      {result?.status === 'OK' && result.pubkey && (
        <div
          className="rounded-lg px-3 py-2 text-sm"
          style={{
            background: 'var(--color-accent-dim)',
            color: 'var(--color-accent)',
            borderRadius: 'var(--radius-md)',
          }}
          role="status"
        >
          Authenticated as {result.pubkey.slice(0, 8)}…{result.pubkey.slice(-6)}
        </div>
      )}

      {error && (
        <p className="text-xs" style={{ color: 'var(--color-error, #ef4444)' }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
