# Nostr Reference (NIP-07)

Nostr is a decentralized social protocol. Fedi injects `window.nostr` (a NIP-07 provider) into every Mini App's WebView, giving the app access to the user's public key and signing capability without ever exposing the private key.

## How Fedi injects window.nostr

Like `window.webln`, Fedi's native layer injects a NIP-07-compliant `NostrProvider` before the page loads. The private key stays inside the native app — the Mini App only ever receives signed events or the public key.

Outside Fedi, `window.nostr` is `undefined`.

## Detection pattern

```ts
if (typeof window.nostr !== 'undefined') {
  const pubkey = await window.nostr.getPublicKey();
} else {
  // not in Fedi, or provider not available
}
```

Prefer the `@create-fedi-app/nostr` hooks — they handle this for you.

## React hooks (preferred)

### useNostr()

Low-level access to the provider and connection state.

```ts
import { useNostr } from '@create-fedi-app/nostr';

const { provider, pubkey, npub, isLoading, error, isConnected } = useNostr();
```

| Field | Type | Description |
|-------|------|-------------|
| `provider` | `NostrProvider \| null` | Raw NIP-07 provider |
| `pubkey` | `string \| null` | Hex-encoded 32-byte public key |
| `npub` | `string \| null` | bech32-encoded public key (`npub1…`) |
| `isLoading` | `boolean` | True while provider initialises |
| `error` | `Error \| null` | Initialisation error |
| `isConnected` | `boolean` | Shorthand for `provider !== null` |

### useIdentity()

Higher-level hook for the common "connect + sign" flow.

```ts
import { useIdentity } from '@create-fedi-app/nostr';

const {
  pubkey,
  npub,
  displayNpub,
  getPublicKey,
  signEvent,
  isConnecting,
} = useIdentity();
```

| Field | Type | Description |
|-------|------|-------------|
| `pubkey` | `string \| null` | Hex public key (null until connected) |
| `npub` | `string \| null` | bech32 public key |
| `displayNpub` | `string \| null` | Truncated: `npub1abc…xyz` |
| `getPublicKey()` | `() => Promise<string \| null>` | Trigger key retrieval |
| `signEvent(event)` | `(UnsignedNostrEvent) => Promise<NostrEvent \| null>` | Sign a Nostr event |
| `isConnecting` | `boolean` | True during `signEvent` |

## Full API (window.nostr)

### getPublicKey()

```ts
const pubkey = await window.nostr.getPublicKey(): Promise<string>
```

Returns the user's hex-encoded 32-byte Schnorr public key. This is the canonical Nostr identity — a stable, unique identifier per user.

**This does not request funds or sign anything.** Safe to call for login flows.

### signEvent()

```ts
const signedEvent = await window.nostr.signEvent(event: UnsignedNostrEvent): Promise<NostrEvent>

interface UnsignedNostrEvent {
  pubkey: string;      // must match the user's pubkey
  created_at: number;  // Unix timestamp
  kind: number;        // Nostr event kind
  tags: string[][];    // array of tag arrays
  content: string;
}

interface NostrEvent extends UnsignedNostrEvent {
  id: string;   // hex-encoded event hash (SHA-256 of canonical serialisation)
  sig: string;  // hex-encoded Schnorr signature
}
```

Common kinds: `0` = profile metadata, `1` = short text note, `4` = encrypted DM.

### getRelays()

```ts
const relays = await window.nostr.getRelays(): Promise<Record<string, { read: boolean; write: boolean }>>
```

Returns the user's configured relay list. Example:

```ts
{
  'wss://relay.damus.io': { read: true, write: true },
  'wss://nos.lol': { read: true, write: false },
}
```

### nip04 (encrypted DMs)

```ts
// Encrypt a message to a recipient's pubkey
const ciphertext = await window.nostr.nip04.encrypt(recipientPubkey: string, plaintext: string): Promise<string>

// Decrypt a message encrypted to your pubkey
const plaintext = await window.nostr.nip04.decrypt(senderPubkey: string, ciphertext: string): Promise<string>
```

NIP-04 uses ECDH + AES-256-CBC. The ciphertext format is `<base64>?iv=<base64>`.

## npub format and bech32 encoding

The raw public key is a 32-byte value encoded as 64 hex characters. `npub` is the human-readable bech32 encoding of the same bytes:

```
hex:  79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798
npub: npub10279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798
```

The `@create-fedi-app/nostr` package converts between formats automatically via `@scure/base`.

To display a truncated npub (for avatars, etc.):
```ts
const displayNpub = npub.slice(0, 8) + '...' + npub.slice(-4);
// → "npub1abc...xyz4"
```

## Nostr as login (no username/password)

Because `getPublicKey()` returns a stable identifier, you can use it as a passwordless login:

1. Get the pubkey — this is the user's "account"
2. Store any per-user data keyed on `pubkey`
3. To authenticate a server request, have the user sign a challenge event (kind: 27235, NIP-98)

The user never creates an account — their Fedi identity is their account.

## Common patterns

### Connect on button press (lazy)

```tsx
'use client';
import { useIdentity } from '@create-fedi-app/nostr';

export function ConnectButton() {
  const { pubkey, displayNpub, getPublicKey, isConnecting } = useIdentity();

  if (pubkey) {
    return <span className="font-mono text-sm">{displayNpub}</span>;
  }

  return (
    <button onClick={getPublicKey} disabled={isConnecting}>
      {isConnecting ? 'Connecting…' : 'Connect with Nostr'}
    </button>
  );
}
```

### Sign a message to prove identity

```ts
const event = await signEvent({
  kind: 1,
  content: 'Hello from my mini app',
  tags: [],
  created_at: Math.floor(Date.now() / 1000),
});

// event.sig proves the user signed this content
// event.pubkey is their identity
// event.id is the canonical hash
```

## MockNostrProvider (tests)

```ts
import { MockNostrProvider } from '@create-fedi-app/nostr';
```

`MockNostrProvider` uses a deterministic test keypair (well-known secp256k1 generator point) and produces real Schnorr signatures via `@noble/curves`.

```ts
const mock = new MockNostrProvider();

await mock.getPublicKey();
// → '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'

await mock.signEvent({ kind: 1, content: 'test', tags: [], created_at: 0, pubkey: '...' });
// → fully valid NostrEvent with real id and sig

await mock.getRelays();
// → { 'wss://relay.damus.io': { read: true, write: true }, ... }

await mock.nip04.encrypt('somePubkey', 'hello');
// → base64-encoded fake ciphertext
```

**The test keypair is a well-known vector — NEVER use in production.**

Use in Vitest tests by passing to the `NostrProvider` context:

```tsx
import { NostrProvider } from '@create-fedi-app/nostr';
import { MockNostrProvider } from '@create-fedi-app/nostr';

render(
  <NostrProvider mock={new MockNostrProvider()}>
    <YourComponent />
  </NostrProvider>
);
```
