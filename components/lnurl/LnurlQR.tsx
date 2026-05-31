'use client';

import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QR_FOREGROUND } from '../InvoiceQr';
import { useIsMounted } from '../../hooks/useIsMounted';
import { decodeLnurl, encodeLnurl } from '../../lib/lnurl-utils';

interface ILnurlQRProps {
  /** Raw HTTPS URL or already-encoded LNURL string. */
  value: string;
  /** Human-readable label for assistive tech. */
  label?: string;
  size?: number;
  className?: string;
}

function toLnurlString(value: string): string {
  const trimmed = value.trim();
  if (trimmed.toLowerCase().startsWith('lnurl')) {
    return trimmed.toUpperCase();
  }
  return encodeLnurl(trimmed);
}

/**
 * Renders a bech32-encoded LNURL as a scannable QR code with copy support.
 */
export function LnurlQR({ value, label = 'LNURL QR code', size = 160, className }: ILnurlQRProps) {
  const mounted = useIsMounted();
  const [copied, setCopied] = useState(false);

  const { lnurl, encodeError } = useMemo(() => {
    if (!value.trim()) {
      return { lnurl: '', encodeError: null as string | null };
    }
    try {
      return { lnurl: toLnurlString(value), encodeError: null };
    } catch (err) {
      return {
        lnurl: '',
        encodeError: err instanceof Error ? err.message : 'Invalid LNURL',
      };
    }
  }, [value]);

  const decodedUrl = useMemo(() => {
    if (!lnurl) return null;
    try {
      return decodeLnurl(lnurl);
    } catch {
      return null;
    }
  }, [lnurl]);

  async function handleCopy() {
    if (!lnurl) return;
    await navigator.clipboard.writeText(lnurl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (encodeError) {
    return (
      <p className="text-xs" style={{ color: 'var(--color-error, #ef4444)' }} role="alert">
        {encodeError}
      </p>
    );
  }

  if (!mounted || !lnurl) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-text-subtle)' }} aria-live="polite">
        Preparing QR code…
      </p>
    );
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl p-4 ${className ?? ''}`}
      style={{
        background: 'var(--color-surface-1)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        className="mx-auto flex w-full max-w-[200px] items-center justify-center rounded-lg p-3"
        style={{ background: 'var(--color-surface-2)' }}
        aria-label={label}
      >
        <QRCodeSVG
          value={lnurl}
          size={size}
          level="M"
          bgColor="transparent"
          fgColor={QR_FOREGROUND}
        />
      </div>

      <p
        className="break-all text-center font-mono text-xs leading-relaxed"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {lnurl.slice(0, 24)}…{lnurl.slice(-12)}
      </p>

      {decodedUrl && (
        <p className="break-all text-center text-xs" style={{ color: 'var(--color-text-subtle)' }}>
          {decodedUrl}
        </p>
      )}

      <button
        type="button"
        onClick={handleCopy}
        className="w-full rounded-lg px-4 py-2 text-sm font-medium transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-80 active:opacity-70"
        style={{
          background: 'var(--color-surface-2)',
          color: 'var(--color-text)',
          borderRadius: 'var(--radius-md)',
        }}
        aria-label={copied ? 'LNURL copied' : 'Copy LNURL string'}
      >
        {copied ? 'Copied!' : 'Copy LNURL'}
      </button>
    </div>
  );
}
