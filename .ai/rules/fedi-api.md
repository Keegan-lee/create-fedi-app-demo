# Fedi Internal API Reference

`window.fediInternal` is an optional, versioned API injected by Fedi for Mini App discovery features. Unlike `window.webln` and `window.nostr`, it may not be present even inside Fedi (older app versions will not have it).

## Version detection

Always check both existence and version before calling methods:

```ts
import { getFediInternalVersion } from '../lib/fedi';

const version = getFediInternalVersion();
// → 0 | 1 | 2 | null

if (version === 2) {
  // v2 methods available
} else if (version === null) {
  // not in Fedi, or very old version
}
```

The helper in `lib/fedi.ts`:

```ts
export function getFediInternalVersion(): 0 | 1 | 2 | null {
  if (typeof window === 'undefined' || !window.fediInternal) return null;
  return window.fediInternal.version as 0 | 1 | 2;
}
```

## TypeScript types

```ts
type FediInternalV0 = { version: 0 };
type FediInternalV1 = { version: 1 };
type FediInternalV2 = {
  version: 2;
  getInstalledMiniApps(): Promise<Array<{ url: string }>>;
  installMiniApp(miniApp: {
    id: string;
    title: string;
    url: string;
    imageUrl?: string | null;
    description?: string;
  }): Promise<void>;
};

type FediInternal = FediInternalV0 | FediInternalV1 | FediInternalV2;
```

## v2 API

### getInstalledMiniApps()

```ts
const apps = await window.fediInternal.getInstalledMiniApps(): Promise<Array<{ url: string }>>
```

Returns the list of Mini App URLs the current user has installed in Fedi. Useful for detecting if a companion app is installed, or for showing an "install" prompt.

### installMiniApp()

```ts
await window.fediInternal.installMiniApp({
  id: string;        // unique identifier, e.g. "com.example.myapp"
  title: string;     // display name shown in Fedi
  url: string;       // the Mini App URL
  imageUrl?: string; // icon URL (optional)
  description?: string;
}): Promise<void>
```

Triggers Fedi's native UI to add a Mini App to the user's home screen. Resolves when the user confirms (or rejects) the install prompt.

## Permissions (`manageInstalledMiniApps`)

Both `getInstalledMiniApps()` and `installMiniApp()` require Fedi's **`manageInstalledMiniApps`** permission. Fedi prompts on first call. **Never invoke these methods on page load** — only after a user taps a button.

Detect permission denials with `isFediPermissionError()` from `lib/fedi.ts`:

```ts
import { isFediPermissionError } from '../lib/fedi';

try {
  await getInstalledMiniApps!();
} catch (err) {
  if (isFediPermissionError(err)) {
    // Show ManageMiniAppsPermissionHint + manual retry
  }
}
```

If the user denied with "Remember my choice", they must reset the permission in Fedi mini app settings before retrying.

## useFediInternal() hook

```ts
import { useFediInternal } from '../hooks/useFediInternal';

const { isAvailable, version, getInstalledMiniApps, installMiniApp } = useFediInternal();
```

| Field | Type | Description |
|-------|------|-------------|
| `isAvailable` | `boolean` | True if `window.fediInternal` is present |
| `version` | `0 \| 1 \| 2 \| null` | Detected version |
| `getInstalledMiniApps` | `V2['getInstalledMiniApps'] \| null` | Null if version < 2 |
| `installMiniApp` | `V2['installMiniApp'] \| null` | Null if version < 2 |

Non-v2 methods are `null` — always check before calling:

```tsx
'use client';
import { useFediInternal } from '../hooks/useFediInternal';

export function InstallPrompt() {
  const { installMiniApp } = useFediInternal();

  if (!installMiniApp) return null;

  return (
    <button onClick={() => installMiniApp({
      id: 'com.example.myapp',
      title: 'My App',
      url: 'https://myapp.example.com',
    })}>
      Add to Fedi
    </button>
  );
}
```

## Version history

| Version | Features |
|---------|----------|
| `null` | Not in Fedi, or Fedi version predates fediInternal |
| `0` | Fedi version is aware of the API but exposes nothing |
| `1` | Reserved |
| `2` | `getInstalledMiniApps`, `installMiniApp` |
