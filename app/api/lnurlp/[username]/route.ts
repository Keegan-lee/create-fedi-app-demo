import { NextResponse } from 'next/server';
import {
  buildLnurlMetadata,
  getLnurlServerBaseUrl,
  msatsToSats,
} from '../../../../lib/lnurl-utils';
import { createLnurlPayInvoice } from '../../../../lib/lnurl-store';

const DEFAULT_MIN_MSATS = 1_000;
const DEFAULT_MAX_MSATS = 10_000_000_000;

type TRouteContext = { params: Promise<{ username: string }> };

/**
 * LNURL-pay endpoint (LUD-06).
 * GET without `amount` returns payRequest metadata; with `amount` returns a BOLT11 invoice.
 */
export async function GET(request: Request, context: TRouteContext) {
  const { username } = await context.params;
  const { searchParams } = new URL(request.url);
  const amountParam = searchParams.get('amount');

  if (!username || !/^[a-zA-Z0-9_-]+$/.test(username)) {
    return NextResponse.json({ status: 'ERROR', reason: 'Invalid username' }, { status: 400 });
  }

  const baseUrl = getLnurlServerBaseUrl(request);
  const callbackUrl = `${baseUrl}/api/lnurlp/${encodeURIComponent(username)}`;

  if (amountParam !== null) {
    const amountMsats = Number.parseInt(amountParam, 10);
    if (!Number.isFinite(amountMsats) || amountMsats < DEFAULT_MIN_MSATS) {
      return NextResponse.json(
        { status: 'ERROR', reason: 'Invalid amount' },
        { status: 400 },
      );
    }

    if (amountMsats > DEFAULT_MAX_MSATS) {
      return NextResponse.json(
        { status: 'ERROR', reason: 'Amount above maximum' },
        { status: 400 },
      );
    }

    const pr = createLnurlPayInvoice(amountMsats, username);
    return NextResponse.json({
      pr,
      routes: [],
      successAction: {
        tag: 'message',
        message: `Received ${msatsToSats(amountMsats)} sats for @${username}`,
      },
    });
  }

  const metadata = buildLnurlMetadata([
    ['text/plain', `Pay @${username} via LNURL`],
    ['text/identifier', `${username}@fedi`],
  ]);

  return NextResponse.json({
    tag: 'payRequest',
    callback: callbackUrl,
    minSendable: DEFAULT_MIN_MSATS,
    maxSendable: DEFAULT_MAX_MSATS,
    metadata,
    commentAllowed: 140,
  });
}
