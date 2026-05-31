'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePayment } from '../../lib/webln';
import { getDemoLnurlSats } from '../../lib/payment-config';
import { LnurlQR } from './LnurlQR';

type TWithdrawRequest = {
  tag: string;
  callback: string;
  k1: string;
  minWithdrawable: number;
  maxWithdrawable: number;
  defaultDescription: string;
  lnurl: string;
};

type TWithdrawResult = {
  status: string;
  reason?: string;
};

/**
 * Demo LNURL-withdraw flow: shows withdraw LNURL and simulates wallet payout via WebLN invoice.
 */
export function LnurlWithdraw({ className }: { className?: string }) {
  const { makeInvoice, isCreatingInvoice } = usePayment();
  const [request, setRequest] = useState<TWithdrawRequest | null>(null);
  const [result, setResult] = useState<TWithdrawResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const loadRequest = useCallback(async () => {
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/lnurlw');
      if (!res.ok) throw new Error('Failed to load withdraw request');
      const data = (await res.json()) as TWithdrawRequest;
      setRequest(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load withdraw request');
    }
  }, []);

  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);

  async function handleSimulateWithdraw() {
    if (!request) return;
    setIsWithdrawing(true);
    setError(null);

    try {
      const invoiceRes = await makeInvoice({
        amount: String(getDemoLnurlSats()),
        defaultMemo: request.defaultDescription,
      });

      if (!invoiceRes?.paymentRequest) {
        setError('WebLN not available. Open inside Fedi to create a withdraw invoice.');
        return;
      }

      const params = new URLSearchParams({
        k1: request.k1,
        pr: invoiceRes.paymentRequest,
        tag: 'withdrawLink',
      });

      const res = await fetch(`${request.callback}?${params.toString()}`);
      const data = (await res.json()) as TWithdrawResult;
      setResult(data);

      if (data.status !== 'OK') {
        setError(data.reason ?? 'Withdraw failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdraw failed');
    } finally {
      setIsWithdrawing(false);
    }
  }

  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      {request?.lnurl && (
        <LnurlQR value={request.lnurl} label="LNURL-withdraw QR code" />
      )}

      {request && (
        <p className="text-center text-xs" style={{ color: 'var(--color-text-subtle)' }}>
          Max withdrawable: {Math.floor(request.maxWithdrawable / 1000)} sats (demo cap)
        </p>
      )}

      <button
        type="button"
        onClick={handleSimulateWithdraw}
        disabled={!request || isWithdrawing || isCreatingInvoice}
        className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-90 active:opacity-80 disabled:opacity-50"
        style={{
          background: 'var(--color-accent)',
          color: 'var(--color-primary-foreground)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {isWithdrawing || isCreatingInvoice ? 'Processing…' : 'Simulate wallet withdraw'}
      </button>

      <button
        type="button"
        onClick={() => void loadRequest()}
        className="w-full text-xs transition-opacity duration-200 hover:opacity-80"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Refresh withdraw link
      </button>

      {result?.status === 'OK' && (
        <div
          className="rounded-lg px-3 py-2 text-sm"
          style={{
            background: 'var(--color-accent-dim)',
            color: 'var(--color-accent)',
            borderRadius: 'var(--radius-md)',
          }}
          role="status"
        >
          Withdraw callback accepted. Invoice submitted to service.
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
