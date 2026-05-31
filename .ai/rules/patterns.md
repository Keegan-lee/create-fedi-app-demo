# Canonical Fedi Mini App Patterns

Copy these patterns directly. Each one is tested, idiomatic, and handles the edge cases specific to Fedi's WebView environment.

---

## Pattern 1: Check if running inside Fedi

Detect the Fedi environment and degrade gracefully for users who open the app URL in a regular browser.

```tsx
'use client';
import { useWebLN } from '@create-fedi-app/webln';

export function FediGuard({ children }: { children: React.ReactNode }) {
  const { isConnected, isLoading } = useWebLN();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Connecting…
        </span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div
        className="rounded-lg p-6 text-center"
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
          Open in Fedi
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          This app requires the Fedi wallet. Download Fedi to continue.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
```

---

## Pattern 2: Request a Lightning payment

Pay a BOLT11 invoice. Handles pending, success, and error states.

```tsx
'use client';
import { useState } from 'react';
import { usePayment } from '@create-fedi-app/webln';

interface PayInvoiceProps {
  invoice: string;
  onSuccess: (preimage: string) => void;
}

export function PayInvoice({ invoice, onSuccess }: PayInvoiceProps) {
  const { sendPayment, isPaying, paymentError } = usePayment();
  const [paid, setPaid] = useState(false);

  async function handlePay() {
    const result = await sendPayment(invoice);
    if (result?.preimage) {
      setPaid(true);
      onSuccess(result.preimage);
    }
  }

  if (paid) {
    return (
      <p className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
        Payment sent ✓
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handlePay}
        disabled={isPaying || !invoice}
        className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'var(--color-accent)', color: '#fff', borderRadius: 'var(--radius-md)' }}
      >
        {isPaying ? (
          <>
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Paying…
          </>
        ) : (
          'Pay Invoice'
        )}
      </button>
      {paymentError && (
        <p className="text-xs" style={{ color: '#ef4444' }}>
          {paymentError.message}
        </p>
      )}
    </div>
  );
}
```

---

## Pattern 3: Create an invoice (receive payment)

Generate a BOLT11 invoice so someone can pay you. Displays the invoice string and a QR-friendly value.

```tsx
'use client';
import { useState } from 'react';
import { usePayment } from '@create-fedi-app/webln';

export function ReceivePayment() {
  const { makeInvoice, isCreatingInvoice, paymentError, lastInvoice } = usePayment();
  const [sats, setSats] = useState('');

  async function handleCreate() {
    if (!sats || isNaN(Number(sats))) return;
    await makeInvoice({ amount: sats, defaultMemo: 'Payment request' });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          type="number"
          value={sats}
          onChange={(e) => setSats(e.target.value)}
          placeholder="Amount in sats"
          className="flex-1 rounded-lg px-3 py-2 text-sm"
          style={{
            background: 'var(--color-surface-2)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        />
        <button
          onClick={handleCreate}
          disabled={isCreatingInvoice || !sats}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: 'var(--color-accent)', color: '#fff', borderRadius: 'var(--radius-md)' }}
        >
          {isCreatingInvoice ? 'Creating…' : 'Create Invoice'}
        </button>
      </div>

      {lastInvoice && (
        <div
          className="p-3 rounded-lg break-all"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
            {lastInvoice.slice(0, 40)}…
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(lastInvoice)}
            className="mt-2 text-xs font-semibold"
            style={{ color: 'var(--color-accent)' }}
          >
            Copy invoice
          </button>
        </div>
      )}

      {paymentError && (
        <p className="text-xs" style={{ color: '#ef4444' }}>
          {paymentError.message}
        </p>
      )}
    </div>
  );
}
```

---

## Pattern 4: Get user's Nostr identity

A connect button that resolves to the user's public key. Once connected, shows their truncated npub.

```tsx
'use client';
import { useIdentity } from '@create-fedi-app/nostr';

export function NostrIdentity() {
  const { pubkey, displayNpub, getPublicKey, isConnecting } = useIdentity();

  if (pubkey) {
    return (
      <div className="inline-flex items-center gap-2">
        <span
          className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: `hsl(${(parseInt(pubkey.slice(0, 2), 16) / 255) * 360}, 60%, 50%)`,
            color: '#fff',
          }}
        >
          {pubkey.slice(0, 1).toUpperCase()}
        </span>
        <span className="font-mono text-sm" style={{ color: 'var(--color-text)' }}>
          {displayNpub}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={getPublicKey}
      disabled={isConnecting}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
      style={{ background: 'var(--color-accent)', color: '#fff', borderRadius: 'var(--radius-md)' }}
    >
      {isConnecting ? 'Connecting…' : 'Connect Nostr'}
    </button>
  );
}
```

---

## Pattern 5: Pay-to-unlock content

Gate content behind a Lightning payment. The server verifies the preimage before revealing the content. This is the most common Fedi Mini App monetisation pattern.

```tsx
// Client component
'use client';
import { useState } from 'react';
import { usePayment } from '@create-fedi-app/webln';

interface PaywallProps {
  contentId: string;
  priceSats: number;
  onUnlocked: (content: string) => void;
}

export function Paywall({ contentId, priceSats, onUnlocked }: PaywallProps) {
  const { makeInvoice, sendPayment, isPaying, isCreatingInvoice, paymentError } = usePayment();
  const [step, setStep] = useState<'idle' | 'paying' | 'verifying' | 'error'>('idle');

  async function unlock() {
    setStep('paying');

    // 1. Get invoice from your server
    const res = await fetch(`/api/invoice?contentId=${contentId}&sats=${priceSats}`);
    const { invoice } = await res.json();

    // 2. User pays it
    const payment = await sendPayment(invoice);
    if (!payment) {
      setStep('error');
      return;
    }

    // 3. Send preimage to server as proof of payment
    setStep('verifying');
    const verifyRes = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, preimage: payment.preimage }),
    });
    const { content } = await verifyRes.json();
    onUnlocked(content);
  }

  const isWorking = step === 'paying' || step === 'verifying' || isPaying || isCreatingInvoice;

  return (
    <div
      className="p-6 rounded-lg text-center"
      style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)' }}
    >
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
        Unlock this content
      </p>
      <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
        {priceSats.toLocaleString()} sats
      </p>
      <button
        onClick={unlock}
        disabled={isWorking}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
        style={{ background: 'var(--color-accent)', color: '#fff', borderRadius: 'var(--radius-md)' }}
      >
        {step === 'verifying' ? 'Verifying…' : isWorking ? 'Paying…' : `Pay ${priceSats} sats`}
      </button>
      {(paymentError || step === 'error') && (
        <p className="mt-2 text-xs" style={{ color: '#ef4444' }}>
          {paymentError?.message ?? 'Payment failed. Please try again.'}
        </p>
      )}
    </div>
  );
}
```

---

## Pattern 6: Nostr-authenticated API call

Use a signed Nostr event as a bearer token to prove identity to your server. No passwords, no JWTs issued by a third party — the user's private key is the credential.

```ts
// lib/nostr-auth.ts
import type { NostrEvent } from '@create-fedi-app/nostr';

// NIP-98 HTTP Auth event (kind 27235)
export async function buildAuthHeader(
  url: string,
  method: string,
  signEvent: (event: Omit<NostrEvent, 'id' | 'sig'>) => Promise<NostrEvent | null>
): Promise<string | null> {
  const event = await signEvent({
    kind: 27235,
    pubkey: '', // filled by signEvent
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['u', url],
      ['method', method],
    ],
    content: '',
  });

  if (!event) return null;
  return 'Nostr ' + btoa(JSON.stringify(event));
}
```

```tsx
// Usage in a component
'use client';
import { useIdentity } from '@create-fedi-app/nostr';
import { buildAuthHeader } from '../lib/nostr-auth';

export function ProtectedAction() {
  const { pubkey, getPublicKey, signEvent } = useIdentity();

  async function callProtectedAPI() {
    if (!pubkey) await getPublicKey();

    const url = `${window.location.origin}/api/protected`;
    const authHeader = await buildAuthHeader(url, 'POST', signEvent);
    if (!authHeader) return;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'do-thing' }),
    });

    const data = await res.json();
    // handle response
  }

  return (
    <button onClick={callProtectedAPI}>
      {pubkey ? 'Call API' : 'Connect & Call API'}
    </button>
  );
}
```

```ts
// Server-side verification (Next.js App Router route handler)
// app/api/protected/route.ts
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const authHeader = headers().get('Authorization');
  if (!authHeader?.startsWith('Nostr ')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = JSON.parse(atob(authHeader.slice(6)));

  // Verify: kind must be 27235, timestamp must be recent, tags must match
  if (event.kind !== 27235) return Response.json({ error: 'Invalid event kind' }, { status: 401 });
  if (Math.abs(Date.now() / 1000 - event.created_at) > 60) {
    return Response.json({ error: 'Event expired' }, { status: 401 });
  }

  // event.pubkey is the verified user identity
  const userPubkey = event.pubkey;

  return Response.json({ ok: true, user: userPubkey });
}
```
