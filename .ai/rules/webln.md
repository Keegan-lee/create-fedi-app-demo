# WebLN Reference

WebLN is a JavaScript standard for browser-based Lightning wallet access. In Fedi, `window.webln` is injected by the native app into every Mini App's WebView.

## How Fedi injects window.webln

Fedi's native app injects a `WebLNProvider` implementation into `window.webln` before the page loads. This provider routes calls through the native Lightning node (Fedimint eCash). No installation, no permissions dialog — it's there when the app opens inside Fedi.

Outside Fedi (regular browser, SSR, tests without mocks) `window.webln` is `undefined`.

## Detection pattern

Always check before use. Never assume availability.

```ts
if (typeof window.webln !== 'undefined') {
  // safe to use webln
} else {
  // show fallback UI or message
}
```

The `@create-fedi-app/webln` package handles this internally — prefer using hooks over direct `window.webln` calls.

## React hooks (preferred)

### useWebLN()

Returns the active provider and connection state.

```ts
import { useWebLN } from '@create-fedi-app/webln';

const { provider, isLoading, error, isConnected } = useWebLN();
```

| Field | Type | Description |
|-------|------|-------------|
| `provider` | `WebLNProvider \| null` | The active provider, or null if not connected |
| `isLoading` | `boolean` | True while the provider is initialising |
| `error` | `Error \| null` | Set if provider initialisation failed |
| `isConnected` | `boolean` | Shorthand for `provider !== null` |

### usePayment()

State-managed wrappers for `sendPayment` and `makeInvoice`.

```ts
import { usePayment } from '@create-fedi-app/webln';

const {
  sendPayment,
  makeInvoice,
  isPaying,
  isCreatingInvoice,
  paymentError,
  lastPreimage,
  lastInvoice,
} = usePayment();
```

| Field | Type | Description |
|-------|------|-------------|
| `sendPayment(invoice)` | `(str) => Promise<SendPaymentResponse \| null>` | Pay a BOLT11 invoice |
| `makeInvoice(args)` | `(args) => Promise<RequestInvoiceResponse \| null>` | Create a receive invoice |
| `isPaying` | `boolean` | True during `sendPayment` |
| `isCreatingInvoice` | `boolean` | True during `makeInvoice` |
| `paymentError` | `Error \| null` | Last error from either call |
| `lastPreimage` | `string \| null` | Preimage from last successful payment |
| `lastInvoice` | `string \| null` | Payment request from last created invoice |

## Full API (window.webln)

### enable()

```ts
await window.webln.enable(): Promise<void>
```

Requests wallet access. **You do not need to call this in Fedi** — the `@create-fedi-app/webln` provider calls it automatically during initialisation.

### getInfo()

```ts
const info = await window.webln.getInfo(): Promise<GetInfoResponse>
```

```ts
interface GetInfoResponse {
  node: {
    alias: string;   // e.g. "Fedi Dev Node"
    pubkey: string;  // hex-encoded node public key
    color: string;   // hex color, e.g. "#FF6B35"
  };
  methods: string[]; // e.g. ["sendPayment", "makeInvoice", "getInfo", "signMessage"]
}
```

### sendPayment()

```ts
const result = await window.webln.sendPayment(paymentRequest: string): Promise<SendPaymentResponse>
```

`paymentRequest` must be a BOLT11 string starting with `lnbc`.

```ts
interface SendPaymentResponse {
  preimage: string; // hex-encoded 32-byte payment preimage — proof of payment
}
```

Throws on failure (insufficient funds, expired invoice, routing failure, etc.).

### makeInvoice()

```ts
const result = await window.webln.makeInvoice(args): Promise<RequestInvoiceResponse>
```

```ts
// Three calling conventions — all valid:
makeInvoice(1000)                                    // exact sats
makeInvoice('1000')                                  // exact sats as string
makeInvoice({ amount: '1000', defaultMemo: 'Coffee' }) // full args

interface RequestInvoiceArgs {
  amount?: string | number;        // exact amount in sats
  defaultAmount?: string | number; // suggested amount (user can change)
  minimumAmount?: string | number;
  maximumAmount?: string | number;
  defaultMemo?: string;
}

interface RequestInvoiceResponse {
  paymentRequest: string; // BOLT11 string
}
```

### signMessage()

```ts
const result = await window.webln.signMessage(message: string): Promise<SignMessageResponse>

interface SignMessageResponse {
  message: string;    // the original message
  signature: string;  // hex-encoded signature
}
```

Produces a Lightning node signature. Useful for proving Lightning identity. Not the same as Nostr signing.

### sendKeysend()

```ts
const result = await window.webln.sendKeysend(args: KeysendArgs): Promise<SendPaymentResponse>

interface KeysendArgs {
  destination: string;               // destination node pubkey
  amount: string | number;           // sats
  customRecords?: Record<string, string>; // TLV records
}
```

### verifyMessage()

```ts
await window.webln.verifyMessage(signature: string, message: string): Promise<void>
```

Verifies a signature produced by `signMessage`. Throws if invalid.

## Common errors

| Error message | Cause | Fix |
|--------------|-------|-----|
| `"Payment failed"` | Generic payment failure | Show user-friendly error, offer retry |
| `"Invalid payment request: must start with lnbc"` | Bad invoice string | Validate invoice format before calling |
| `"Insufficient funds"` | Wallet balance too low | Show balance, suggest amount |
| `"Invoice expired"` | BOLT11 invoice past expiry | Refresh invoice and retry |

## Graceful fallback pattern

```tsx
'use client';
import { useWebLN } from '@create-fedi-app/webln';

export function PaymentSection() {
  const { isConnected, isLoading } = useWebLN();

  if (isLoading) return <p>Connecting to wallet…</p>;

  if (!isConnected) {
    return (
      <div>
        <p>Open this app inside Fedi to make payments.</p>
      </div>
    );
  }

  return <YourPaymentUI />;
}
```

## MockWebLNProvider (tests)

```ts
import { MockWebLNProvider } from '@create-fedi-app/webln';

// Default: succeeds with 600ms delay
const mock = new MockWebLNProvider();

// Custom options:
const slowMock = new MockWebLNProvider({ paymentDelay: 2000 });
const failMock = new MockWebLNProvider({
  shouldFail: true,
  failureMessage: 'Simulated failure',
});
```

`MockWebLNProvider` implements the full `WebLNProvider` interface:
- `enable()` — no-op (throws if `shouldFail: true`)
- `getInfo()` — returns static Fedi Dev Node info
- `makeInvoice(args)` — returns a fake `lnbc...` string
- `sendPayment(invoice)` — validates `lnbc` prefix, returns a random preimage hex
- `signMessage(msg)` — returns message + random hex signature
- `sendKeysend(args)` — returns a random preimage hex
- `verifyMessage()` — no-op

Use it in Vitest tests by passing it to the `WebLNProvider` context:

```tsx
import { WebLNProvider } from '@create-fedi-app/webln';
import { MockWebLNProvider } from '@create-fedi-app/webln';

render(
  <WebLNProvider mock={new MockWebLNProvider()}>
    <YourComponent />
  </WebLNProvider>
);
```
