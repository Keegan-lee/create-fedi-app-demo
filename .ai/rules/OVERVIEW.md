# Project Overview

## What is Fedi?

Fedi is a Bitcoin/Lightning wallet and community app built on the Fedimint protocol (federated eCash). It lets communities hold Bitcoin collectively without a single custodian. Users interact with local "Federations" — groups of guardians who jointly manage funds using threshold cryptography.

Fedi ships a built-in browser (WebView) that hosts Mini Apps — small web apps that get direct access to the user's Lightning wallet and Nostr identity through injected JavaScript APIs.

## What is this project?

**{{PROJECT_NAME}}** is a Fedi Mini App. It runs exclusively inside Fedi's WebView at a URL the user navigates to (or pins as an installed app).

This project was scaffolded with [create-fedi-app](https://github.com/fedi/create-fedi-app).

## Stack

- **Framework:** Next.js 16 App Router (TypeScript)
- **Styling:** Tailwind CSS v4 with custom design tokens
- **Fonts:** Bricolage Grotesque (display), DM Sans (body), JetBrains Mono (mono)
- **Payments:** `@create-fedi-app/webln` — wraps `window.webln`
- **Identity:** `@create-fedi-app/nostr` — wraps `window.nostr` (NIP-07)
- **Fedi internals:** `@create-fedi-app/fedi-types` — TypeScript types for all injected APIs
- **Testing:** Vitest + React Testing Library + Playwright

## Selected modules

{{SELECTED_MODULES}}

## The WebLN/Nostr injection model

Fedi injects two globals into every Mini App's WebView:

| Global | Purpose |
|--------|---------|
| `window.webln` | Lightning wallet — send/receive payments |
| `window.nostr` | Nostr identity — public key, signing (NIP-07) |

**These are never available outside Fedi.** In a regular browser, both are `undefined`. All code must check before using them. See `rules/webln.md` and `rules/nostr.md` for full references.

Fedi also injects `window.fediInternal` (optional, versioned) for app-discovery features. See `rules/fedi-api.md`.

## Key constraints for AI agents

1. **Never install external wallet libraries** (`webln`, `alby`, `lightning-browser-extension`, etc.). Fedi provides the WebLN provider — adding a library creates conflicts.
2. **Never install NIP-07 browser extension adapters.** `window.nostr` is already there.
3. **Always guard injected APIs with `typeof window.X !== 'undefined'`** before calling them — SSR and non-Fedi browsers will not have them.
4. **This is an App Router project** — components that use browser APIs or React hooks must have `'use client'` at the top.
5. **WebLN requires explicit `connect()`** — call `connect()` from `useWebLN()` on user action before payments; do not call `window.webln.enable()` on page load.
6. **fediInternal v2 methods require user gesture** — never call `getInstalledMiniApps()` or `installMiniApp()` on mount; handle `manageInstalledMiniApps` denials with `isFediPermissionError()`.

## Links

- Fedi: https://www.fedi.xyz
- Fedimint protocol: https://fedimint.org
- WebLN spec: https://webln.dev
- NIP-07 (Nostr browser extension): https://github.com/nostr-protocol/nips/blob/master/07.md
- create-fedi-app docs: `.ai/rules/` (this directory)
