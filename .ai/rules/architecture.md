# Architecture Reference

## File structure

```
{{PROJECT_NAME}}/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout — fonts, providers, dev toolbar
│   ├── page.tsx                # Home page (client component)
│   ├── globals.css             # Design tokens + Tailwind theme
│   └── demo/                  # Demo pages (remove or repurpose)
│       ├── page.tsx            # Demo index
│       ├── webln/page.tsx      # WebLN payment demo
│       └── nostr/page.tsx      # Nostr identity demo
├── components/
│   ├── providers.tsx           # WebLNProvider + NostrProvider tree
│   ├── FediDevToolbar/         # Dev-only mock controls (strips in production)
│   ├── webln/                  # WebLN UI components
│   └── nostr/                  # Nostr UI components
├── hooks/
│   └── useFediInternal.ts      # window.fediInternal hook
├── lib/
│   ├── fedi.ts                 # isInFedi(), getFediInternalVersion(), formatSats(), shortenNpub()
│   └── utils.ts                # cn() — Tailwind class merging
├── env.ts                      # Type-safe env vars via @t3-oss/env-nextjs
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
└── vitest.setup.ts
```

## App Router conventions

This project uses Next.js 16 App Router. Key rules:

**Server vs client components**

- All components default to Server Components.
- Add `'use client'` to any component that: uses hooks (`useState`, `useEffect`, etc.), references browser globals (`window`, `document`, `navigator`), or imports from `@create-fedi-app/webln` / `@create-fedi-app/nostr`.
- The root layout (`app/layout.tsx`) is a Server Component — it wraps children with `<Providers>` which is a client component.

**Route structure**

- `app/page.tsx` — home (`/`)
- `app/demo/page.tsx` — demo index (`/demo`)
- `app/demo/[feature]/page.tsx` — feature demos (`/demo/webln`, `/demo/nostr`)
- `app/api/[route]/route.ts` — API route handlers

**File colocation**

Components used only by a single route can live adjacent to that route. Shared components belong in `components/`.

## Provider tree

Defined in `components/providers.tsx`:

```tsx
<WebLNProvider>
  <NostrProvider>
    {children}
  </NostrProvider>
</WebLNProvider>
```

Both providers auto-detect `window.webln` / `window.nostr` on mount and make them available via context. The `FediDevToolbar` (dev-only) injects `MockWebLNProvider` and `MockNostrProvider` to simulate Fedi outside the app.

## Module structure

Additional features are added as modules. Each module contributes:

- **`app/demo/[feature]/`** — demo page for the feature
- **`components/[feature]/`** — reusable UI components
- **`hooks/`** — business-logic hooks (e.g. `usePaymentFlow`, `useIdentityFlow`)
- **Module-specific packages** — `@create-fedi-app/webln`, `@create-fedi-app/nostr`

## Where each type of code lives

| What | Where |
|------|-------|
| Design tokens | `app/globals.css` |
| Env variable validation | `env.ts` |
| Fedi utility functions | `lib/fedi.ts` |
| Class merging helper | `lib/utils.ts` |
| Browser API hooks | `hooks/` |
| Feature UI | `components/[feature]/` |
| Route pages | `app/` |
| API handlers | `app/api/[name]/route.ts` |
| Tests | `__tests__/` adjacent to what they test, or `*.test.ts` colocated |

## Key packages

| Package | Purpose |
|---------|---------|
| `@create-fedi-app/webln` | React context + hooks for `window.webln` |
| `@create-fedi-app/nostr` | React context + hooks for `window.nostr` |
| `@create-fedi-app/fedi-types` | TypeScript types for all Fedi-injected APIs |
| `@create-fedi-app/ui` | Shared UI components (added in a later scaffold phase) |

## Environment variables

Validated at build time in `env.ts` using `@t3-oss/env-nextjs`. Add new variables there, not in raw `process.env` calls. Client-side variables must be prefixed `NEXT_PUBLIC_`.

## Routing conventions

- **App Router only** — no Pages Router files.
- **No `index.tsx` files in `app/`** — use `page.tsx` as required by Next.js.
- **Parallel routes** (`@slot/`) are not used in the base template — add only if needed.
- **Loading states** use `loading.tsx` files next to `page.tsx` — not custom suspense boundaries unless needed.
