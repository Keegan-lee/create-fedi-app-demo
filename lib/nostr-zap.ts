import { bech32 } from '@scure/base';
import type { NostrEvent, UnsignedNostrEvent } from './fedi-types';
import type { RelayManager } from './nostr/relay';

const ZAP_REQUEST_KIND = 9734;
const ZAP_RECEIPT_KIND = 9735;
const PROFILE_KIND = 0;

export interface IProfileLightning {
  lud16?: string;
  lud06?: string;
}

export interface ILnurlPayResponse {
  callback: string;
  minSendable: number;
  maxSendable: number;
  allowsNostr?: boolean;
  nostrPubkey?: string;
}

export interface ILnurlZapInvoice {
  pr: string;
  successAction?: { tag: string; message?: string };
}

/** Converts `user@domain.com` lud16 to an LNURL-pay HTTPS endpoint. */
export function lud16ToLnurlPayUrl(lud16: string): string {
  const [name, domain] = lud16.split('@');
  if (!name || !domain) {
    throw new Error('Invalid lud16 address');
  }
  return `https://${domain}/.well-known/lnurlp/${name}`;
}

/** Decodes a bech32 `lnurl…` lud06 string to an HTTPS LNURL endpoint. */
export function lud06ToHttps(lud06: string): string {
  const { words } = bech32.decode(lud06, 2000);
  const bytes = bech32.fromWords(words);
  return new TextDecoder().decode(bytes);
}

/** Parses kind-0 profile metadata for Lightning identifiers. */
export function parseProfileLightning(content: string): IProfileLightning {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return {
      lud16: typeof parsed.lud16 === 'string' ? parsed.lud16 : undefined,
      lud06: typeof parsed.lud06 === 'string' ? parsed.lud06 : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Fetches the recipient's kind-0 profile from relays to resolve a zap LNURL endpoint.
 */
export async function fetchRecipientLnurl(
  manager: RelayManager,
  relayUrls: string[],
  recipientPubkey: string,
): Promise<string | null> {
  const profiles = await manager.query(relayUrls, {
    kinds: [PROFILE_KIND],
    authors: [recipientPubkey],
    limit: 1,
  });

  const profile = profiles.sort((a, b) => b.created_at - a.created_at)[0];
  if (!profile) return null;

  const { lud16, lud06 } = parseProfileLightning(profile.content);
  if (lud16) return lud16ToLnurlPayUrl(lud16);
  if (lud06) return lud06ToHttps(lud06);
  return null;
}

/** Builds an unsigned NIP-57 zap request (kind 9734). */
export function buildZapRequest(params: {
  noteId: string;
  notePubkey: string;
  relayUrls: string[];
  amountMsats: number;
  content?: string;
}): UnsignedNostrEvent {
  return {
    kind: ZAP_REQUEST_KIND,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['e', params.noteId],
      ['p', params.notePubkey],
      ...params.relayUrls.map((url) => ['relays', url] as [string, string]),
      ['amount', String(params.amountMsats)],
    ],
    content: params.content ?? '',
  };
}

/** Fetches LNURL-pay metadata and validates Nostr zap support. */
export async function fetchLnurlPayMetadata(lnurl: string): Promise<ILnurlPayResponse> {
  const res = await fetch(lnurl);
  if (!res.ok) {
    throw new Error(`LNURL lookup failed (${res.status})`);
  }
  const data = (await res.json()) as ILnurlPayResponse;
  if (!data.allowsNostr) {
    throw new Error('This Lightning address does not support Nostr zaps (NIP-57)');
  }
  return data;
}

/**
 * Requests a BOLT11 invoice from an LNURL-pay callback using a signed zap request.
 */
export async function requestZapInvoice(
  callback: string,
  amountMsats: number,
  signedZapRequest: NostrEvent,
): Promise<string> {
  const url = new URL(callback);
  url.searchParams.set('amount', String(amountMsats));
  url.searchParams.set('nostr', JSON.stringify(signedZapRequest));

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Zap invoice request failed (${res.status})`);
  }

  const data = (await res.json()) as ILnurlZapInvoice;
  if (!data.pr) {
    throw new Error('LNURL response did not include an invoice');
  }
  return data.pr;
}

/** Builds a signed zap receipt (kind 9735) after payment. */
export function buildZapReceipt(params: {
  noteId: string;
  notePubkey: string;
  payerPubkey: string;
  bolt11: string;
  preimage: string;
  zapRequest: NostrEvent;
}): UnsignedNostrEvent {
  return {
    kind: ZAP_RECEIPT_KIND,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['p', params.notePubkey],
      ['e', params.noteId],
      ['P', params.payerPubkey],
      ['bolt11', params.bolt11],
      ['preimage', params.preimage],
      ['description', JSON.stringify(params.zapRequest)],
    ],
    content: '',
  };
}
