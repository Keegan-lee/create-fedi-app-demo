import { bech32 } from '@scure/base';

/** LNURL metadata item: [mime type, payload]. */
export type TLnurlMetadataItem = [string, string];

/**
 * Encodes a URL as an uppercase bech32 LNURL string (BIP-173, HRP `lnurl`).
 *
 * The `false` limit disables bech32's default 90-character cap. LNURL callback
 * URLs (host + path + query) routinely exceed that once deployed behind a real
 * domain or tunnel, and `encodeFromBytes` would otherwise throw "Exceeds length
 * limit" — silently breaking LNURL-auth and LNURL-withdraw outside localhost.
 */
export function encodeLnurl(url: string): string {
  const bytes = new TextEncoder().encode(url);
  return bech32.encode('lnurl', bech32.toWords(bytes), false).toUpperCase();
}

/**
 * Decodes a bech32 LNURL string back to the underlying HTTPS URL.
 * Passes `false` to lift the 90-character limit (see {@link encodeLnurl}).
 */
export function decodeLnurl(lnurl: string): string {
  const { words } = bech32.decode(lnurl.toLowerCase(), false);
  const bytes = bech32.fromWords(words);
  return new TextDecoder().decode(bytes);
}

/**
 * Builds the comma-separated metadata string required by LUD-06.
 * @see https://github.com/lnurl/luds/blob/luds/06.md
 */
export function buildLnurlMetadata(items: TLnurlMetadataItem[]): string {
  return JSON.stringify(items);
}

/**
 * Resolves the public base URL for LNURL callbacks.
 * Prefer `LNURL_SERVER_URL` in production behind proxies.
 */
export function getLnurlServerBaseUrl(request?: Request): string {
  const fromEnv = process.env.LNURL_SERVER_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (request) {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    if (host) return `${proto}://${host}`;
  }

  return 'http://localhost:3000';
}

/** Converts millisats to sats for display. */
export function msatsToSats(msats: number): number {
  return Math.floor(msats / 1000);
}

/** Converts sats to millisats for LNURL amounts. */
export function satsToMsats(sats: number): number {
  return sats * 1000;
}
