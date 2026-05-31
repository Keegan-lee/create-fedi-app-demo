# Testing Reference

## Test setup

The project uses **Vitest** with **React Testing Library** for unit/integration tests. Playwright is available for E2E.

Configuration: `vitest.config.ts` and `vitest.setup.ts`.

## Running tests

```bash
pnpm test          # run all tests once
pnpm test:watch    # watch mode
pnpm test:e2e      # Playwright E2E (requires running dev server)
```

## Testing WebLN flows

Always use `MockWebLNProvider` — never mock `window.webln` directly. The mock implements the full interface and validates inputs (e.g. rejects non-`lnbc` invoices).

### Basic payment test

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WebLNProvider } from '@create-fedi-app/webln';
import { MockWebLNProvider } from '@create-fedi-app/webln';
import { PayButton } from '../components/webln/PayButton';

const VALID_INVOICE = 'lnbc1000n1p00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

test('pays invoice and shows preimage', async () => {
  const mock = new MockWebLNProvider({ paymentDelay: 0 });
  const onSuccess = vi.fn();

  render(
    <WebLNProvider mock={mock}>
      <PayButton invoice={VALID_INVOICE} onSuccess={onSuccess} />
    </WebLNProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /pay invoice/i }));
  await waitFor(() => expect(screen.getByText(/payment sent/i)).toBeInTheDocument());
  expect(onSuccess).toHaveBeenCalledWith(expect.any(String));
});
```

### Testing payment failure

```tsx
test('shows error on payment failure', async () => {
  const mock = new MockWebLNProvider({
    shouldFail: true,
    failureMessage: 'Insufficient funds',
    paymentDelay: 0,
  });

  render(
    <WebLNProvider mock={mock}>
      <PayButton invoice={VALID_INVOICE} onSuccess={vi.fn()} />
    </WebLNProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /pay invoice/i }));
  await waitFor(() => expect(screen.getByText(/insufficient funds/i)).toBeInTheDocument());
});
```

### Testing loading state

```tsx
test('shows paying state during payment', async () => {
  const mock = new MockWebLNProvider({ paymentDelay: 5000 });

  render(
    <WebLNProvider mock={mock}>
      <PayButton invoice={VALID_INVOICE} onSuccess={vi.fn()} />
    </WebLNProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /pay invoice/i }));
  expect(screen.getByText(/paying/i)).toBeInTheDocument();
  expect(screen.getByRole('button')).toBeDisabled();
});
```

### Testing fallback when WebLN unavailable

```tsx
test('shows fallback when not in Fedi', () => {
  render(
    <WebLNProvider mock={null}>  {/* null = no provider */}
      <FediGuard>
        <p>Protected content</p>
      </FediGuard>
    </WebLNProvider>
  );

  expect(screen.getByText(/open in fedi/i)).toBeInTheDocument();
  expect(screen.queryByText(/protected content/i)).not.toBeInTheDocument();
});
```

## Testing Nostr flows

Use `MockNostrProvider`. It signs events with a real secp256k1 key, so signatures are valid and can be verified.

### Basic identity test

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NostrProvider } from '@create-fedi-app/nostr';
import { MockNostrProvider } from '@create-fedi-app/nostr';
import { IdentityBadge } from '../components/nostr/IdentityBadge';

const TEST_PUBKEY = '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';

test('connects and shows truncated npub', async () => {
  render(
    <NostrProvider mock={new MockNostrProvider()}>
      <IdentityBadge />
    </NostrProvider>
  );

  fireEvent.click(screen.getByRole('button', { name: /connect nostr/i }));
  await waitFor(() => expect(screen.queryByRole('button')).not.toBeInTheDocument());
  // truncated npub should be visible
  expect(screen.getByText(/npub1.+\.\.\..+/)).toBeInTheDocument();
});
```

### Testing event signing

```tsx
import { useIdentity } from '@create-fedi-app/nostr';
import { MockNostrProvider } from '@create-fedi-app/nostr';

test('signs a text note event', async () => {
  const mock = new MockNostrProvider();
  const { result } = renderHook(() => useIdentity(), {
    wrapper: ({ children }) => (
      <NostrProvider mock={mock}>{children}</NostrProvider>
    ),
  });

  await act(async () => {
    await result.current.getPublicKey();
  });

  const event = await result.current.signEvent({
    kind: 1,
    content: 'test',
    tags: [],
    created_at: Math.floor(Date.now() / 1000),
  });

  expect(event).not.toBeNull();
  expect(event!.id).toHaveLength(64);
  expect(event!.sig).toHaveLength(128);
  expect(event!.pubkey).toBe(TEST_PUBKEY);
});
```

## Vitest setup

`vitest.setup.ts` configures jsdom globals. Key things it provides:
- `window`, `document`, `navigator` (jsdom)
- `@testing-library/jest-dom` matchers (`toBeInTheDocument`, `toBeDisabled`, etc.)
- Does **not** pre-inject `window.webln` or `window.nostr` — use the provider mocks instead

## Playwright E2E patterns

E2E tests live in `e2e/` and use `@playwright/test`.

### Setup

```ts
// e2e/playwright.config.ts — already configured
// Base URL is http://localhost:3000 (dev server)
```

### Mock the Fedi environment in E2E

Since Playwright runs a real browser, inject the mock providers via page evaluation:

```ts
// e2e/helpers/inject-webln.ts
import { Page } from '@playwright/test';

export async function injectMockWebLN(page: Page) {
  await page.addInitScript(() => {
    window.webln = {
      async enable() {},
      async getInfo() {
        return { node: { alias: 'Test', pubkey: '0000', color: '#FF6B35' }, methods: [] };
      },
      async sendPayment(_invoice: string) {
        return { preimage: 'deadbeef'.repeat(8) };
      },
      async makeInvoice(_args: unknown) {
        return { paymentRequest: 'lnbc1000n1test' };
      },
      async signMessage(message: string) {
        return { message, signature: 'aabbcc'.repeat(21) + 'aabb' };
      },
      async verifyMessage() {},
      async sendKeysend(_args: unknown) {
        return { preimage: 'deadbeef'.repeat(8) };
      },
    };
  });
}
```

```ts
// e2e/payment.spec.ts
import { test, expect } from '@playwright/test';
import { injectMockWebLN } from './helpers/inject-webln';

test('user can pay an invoice', async ({ page }) => {
  await injectMockWebLN(page);
  await page.goto('/demo/webln');

  await page.getByRole('button', { name: /pay invoice/i }).click();
  await expect(page.getByText(/payment sent/i)).toBeVisible();
});
```

## What to test vs. what to skip

| Test | How |
|------|-----|
| Payment success/failure flows | Vitest + MockWebLNProvider |
| Nostr connect + signing | Vitest + MockNostrProvider |
| UI state transitions (loading, error, success) | Vitest + RTL |
| Form validation | Vitest + RTL |
| Full user journey | Playwright E2E with injected mocks |
| `window.webln` implementation | Don't test — Fedi owns it |
| `window.nostr` implementation | Don't test — Fedi owns it |
