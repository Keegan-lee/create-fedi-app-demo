import { NextResponse } from 'next/server';
import { encodeLnurl, getLnurlServerBaseUrl } from '../../../lib/lnurl-utils';
import {
  completeAuthSession,
  createAuthSession,
  getAuthSession,
} from '../../../lib/lnurl-store';
import {
  verifyK1SchnorrSignature,
  verifyLnurlAuthEvent,
} from '../../../lib/lnurl-auth-verify';

type TAuthCallbackBody = {
  k1?: string;
  sig?: string;
  key?: string;
  tag?: string;
  event?: string | Record<string, unknown>;
};

function resolveAuthCallback(
  k1: string | null,
  sig: string | null,
  key: string | null,
  tag: string | null,
  event: string | Record<string, unknown> | null,
) {
  if (!k1 || !key || tag !== 'login' || (!sig && !event)) {
    return null;
  }

  const session = getAuthSession(k1);
  if (!session) {
    return NextResponse.json({ status: 'ERROR', reason: 'Unknown or expired k1' });
  }

  let pubkey = key;

  if (event) {
    const eventJson = typeof event === 'string' ? event : JSON.stringify(event);
    const verified = verifyLnurlAuthEvent(k1, eventJson);
    if (!verified.valid) {
      return NextResponse.json({
        status: 'ERROR',
        reason: verified.reason ?? 'Invalid auth event',
      });
    }
    pubkey = verified.pubkey ?? key;
  } else if (sig) {
    if (!verifyK1SchnorrSignature(k1, sig, key)) {
      return NextResponse.json({ status: 'ERROR', reason: 'Invalid signature' });
    }
  } else {
    return NextResponse.json({ status: 'ERROR', reason: 'sig or event required' });
  }

  const completed = completeAuthSession(k1, pubkey);
  if (!completed) {
    return NextResponse.json({ status: 'ERROR', reason: 'Session expired' });
  }

  return NextResponse.json({
    status: 'OK',
    event: 'login',
    pubkey,
  });
}

/**
 * LNURL-auth endpoint (LUD-04).
 * Initial GET returns `{ tag: "auth", k1 }`. Callback GET/POST with sig/key completes login.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callback = resolveAuthCallback(
    searchParams.get('k1'),
    searchParams.get('sig'),
    searchParams.get('key'),
    searchParams.get('tag'),
    searchParams.get('event'),
  );

  if (callback) return callback;

  const session = createAuthSession();
  const baseUrl = getLnurlServerBaseUrl(request);
  const authUrl = `${baseUrl}/api/lnurlauth?tag=login`;
  const lnurl = encodeLnurl(authUrl);

  return NextResponse.json({
    tag: 'auth',
    k1: session.k1,
    lnurl,
    url: authUrl,
  });
}

/** POST callback for mini-app demos (signed Nostr events exceed GET URL limits). */
export async function POST(request: Request) {
  let body: TAuthCallbackBody;
  try {
    body = (await request.json()) as TAuthCallbackBody;
  } catch {
    return NextResponse.json({ status: 'ERROR', reason: 'Invalid JSON body' }, { status: 400 });
  }

  const callback = resolveAuthCallback(
    body.k1 ?? null,
    body.sig ?? null,
    body.key ?? null,
    body.tag ?? null,
    body.event ?? null,
  );

  if (callback) return callback;

  return NextResponse.json({ status: 'ERROR', reason: 'Missing auth parameters' }, { status: 400 });
}
