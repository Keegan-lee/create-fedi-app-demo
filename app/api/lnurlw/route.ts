import { NextResponse } from 'next/server';
import { encodeLnurl, getLnurlServerBaseUrl } from '../../../lib/lnurl-utils';
import {
  completeWithdrawSession,
  createWithdrawSession,
  getWithdrawSession,
} from '../../../lib/lnurl-store';

const DEFAULT_MIN_MSATS = 1_000;
const DEFAULT_MAX_MSATS = 1_000_000_000;

/**
 * LNURL-withdraw endpoint (LUD-03).
 * Initial GET returns withdrawRequest metadata; callback GET with pr completes withdrawal.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const k1 = searchParams.get('k1');
  const pr = searchParams.get('pr');
  const tag = searchParams.get('tag');

  if (k1 && pr && tag === 'withdrawLink') {
    const session = getWithdrawSession(k1);
    if (!session) {
      return NextResponse.json({ status: 'ERROR', reason: 'Unknown or expired k1' });
    }

    if (!pr.startsWith('lnbc')) {
      return NextResponse.json({ status: 'ERROR', reason: 'Invalid payment request' });
    }

    const completed = completeWithdrawSession(k1, pr, DEFAULT_MAX_MSATS);
    if (!completed) {
      return NextResponse.json({ status: 'ERROR', reason: 'Withdraw session expired' });
    }

    return NextResponse.json({
      status: 'OK',
      pr,
    });
  }

  const session = createWithdrawSession();
  const baseUrl = getLnurlServerBaseUrl(request);
  const callback = `${baseUrl}/api/lnurlw`;
  const lnurl = encodeLnurl(callback);

  return NextResponse.json({
    tag: 'withdrawRequest',
    callback,
    k1: session.k1,
    minWithdrawable: DEFAULT_MIN_MSATS,
    maxWithdrawable: DEFAULT_MAX_MSATS,
    defaultDescription: 'LNURL withdraw demo',
    lnurl,
  });
}
