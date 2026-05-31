'use client';

import { useState } from 'react';
import { useIdentity } from '../../lib/nostr';
import { usePayment } from '../../lib/webln';
import {
  buildZapReceipt,
  buildZapRequest,
  fetchLnurlPayMetadata,
  fetchRecipientLnurl,
  requestZapInvoice,
} from '../../lib/nostr-zap';
import { useNostrFeed } from './NostrFeedProvider';

const DEFAULT_ZAP_SATS = 21;

interface IZapButtonProps {
  noteId: string;
  notePubkey: string;
  zapSats?: number;
}

/**
 * NIP-57 zap: LNURL invoice from the recipient's Lightning address, WebLN payment, zap receipt on relay.
 */
export function ZapButton({ noteId, notePubkey, zapSats = DEFAULT_ZAP_SATS }: IZapButtonProps) {
  const { relayUrls, manager } = useNostrFeed();
  const { pubkey, signEvent } = useIdentity();
  const { sendPayment, isPaying } = usePayment();
  const [status, setStatus] = useState<'idle' | 'zapping' | 'zapped' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleZap() {
    if (!pubkey) {
      setStatus('error');
      setErrorMessage('Connect Nostr identity to zap');
      return;
    }

    setStatus('zapping');
    setErrorMessage(null);

    try {
      const lnurl = await fetchRecipientLnurl(manager, relayUrls, notePubkey);
      if (!lnurl) {
        throw new Error('Recipient has no Lightning address on their profile');
      }

      const metadata = await fetchLnurlPayMetadata(lnurl);
      const amountMsats = zapSats * 1000;

      if (amountMsats < metadata.minSendable || amountMsats > metadata.maxSendable) {
        throw new Error(
          `Zap amount must be between ${Math.ceil(metadata.minSendable / 1000)} and ${Math.floor(metadata.maxSendable / 1000)} sats`,
        );
      }

      const zapRequest = buildZapRequest({
        noteId,
        notePubkey,
        relayUrls,
        amountMsats,
      });

      const signedRequest = await signEvent(zapRequest);
      if (!signedRequest) {
        throw new Error('Failed to sign zap request');
      }

      const invoice = await requestZapInvoice(metadata.callback, amountMsats, signedRequest);
      const payment = await sendPayment(invoice);

      if (!payment?.preimage) {
        throw new Error('Payment was not completed');
      }

      const receipt = buildZapReceipt({
        noteId,
        notePubkey,
        payerPubkey: pubkey,
        bolt11: invoice,
        preimage: payment.preimage,
        zapRequest: signedRequest,
      });

      const signedReceipt = await signEvent(receipt);
      if (signedReceipt) {
        await manager.publish(relayUrls, signedReceipt);
      }

      setStatus('zapped');
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Zap failed');
    }
  }

  if (status === 'zapped') {
    return (
      <span
        className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold"
        style={{
          background: 'var(--color-accent-dim)',
          color: 'var(--color-accent)',
        }}
        role="status"
      >
        Zapped {zapSats}⚡
      </span>
    );
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleZap}
        disabled={isPaying || status === 'zapping'}
        className="rounded-md px-2 py-1 text-xs font-semibold transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-80 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text)',
        }}
        aria-label={`Zap ${zapSats} sats`}
        aria-busy={isPaying || status === 'zapping'}
      >
        {isPaying || status === 'zapping' ? '…' : `⚡ ${zapSats}`}
      </button>
      {status === 'error' && errorMessage && (
        <p
          className="max-w-[10rem] text-right text-[10px] leading-tight text-[var(--color-error,#ef4444)]"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
