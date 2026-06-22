import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getPaymentHashFromInvoice } from './lightning/bolt11';
import { createLnurlPayInvoice } from './lightning/lnurl-pay';
import { verifyPreimage } from './lightning/preimage-verify';
import { getDemoGateSats, getLnurlPayAddress } from './payment-config';
import { createPaymentRecord, markPaymentPaid } from './payment-store';

export const PAYMENT_COOKIE_NAME = 'fedi-payment-token';
export const PAYMENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const PROTECTED_ROUTES = [
  { path: '/demo/payment-gated/article', contentId: 'demo-article' },
] as const;

type TCookieReader = {
  get: (name: string) => { value: string } | undefined;
};

function getSigningSecret(): string {
  return process.env.PAYMENT_GATE_SECRET ?? 'dev-payment-gate-secret';
}

function signPayload(payload: string): string {
  return createHmac('sha256', getSigningSecret()).update(payload).digest('hex');
}

/** Constant-time comparison of two hex signatures. */
function signatureMatches(signature: string, expected: string): boolean {
  try {
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    return (
      sigBuffer.length === expectedBuffer.length &&
      timingSafeEqual(sigBuffer, expectedBuffer)
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Access cookie (stateless)
//
// The whole gate is intentionally stateless: a valid, HMAC-signed cookie *is*
// the proof of payment. It is only ever issued after the server verifies a real
// Lightning preimage (see `verifyPayment`), and it is HttpOnly so client code
// can't forge it. Because nothing here reads server memory, the gate survives
// serverless cold starts, multiple instances, and the user returning days later
// — which is exactly where an in-memory store silently fails.
// ---------------------------------------------------------------------------

function buildAccessToken(contentId: string): string {
  return `${contentId}:${signPayload(`access:${contentId}`)}`;
}

function isValidAccessToken(token: string, contentId: string): boolean {
  const idx = token.lastIndexOf(':');
  if (idx < 0) return false;

  const tokenContentId = token.slice(0, idx);
  const signature = token.slice(idx + 1);
  if (tokenContentId !== contentId) return false;

  return signatureMatches(signature, signPayload(`access:${contentId}`));
}

function readPaymentToken(source: NextRequest | TCookieReader): string | null {
  if (source instanceof NextRequest) {
    return (
      source.headers.get('x-payment-token') ??
      source.cookies.get(PAYMENT_COOKIE_NAME)?.value ??
      null
    );
  }

  return source.get(PAYMENT_COOKIE_NAME)?.value ?? null;
}

/**
 * Validates the signed access cookie (or `x-payment-token` header) for a content id.
 * Stateless: a valid signature is sufficient proof of a completed payment.
 */
export function checkPaymentCookie(
  source: NextRequest | TCookieReader,
  contentId: string,
): boolean {
  const token = readPaymentToken(source);
  if (!token) return false;
  return isValidAccessToken(token, contentId);
}

/**
 * Confirms access to gated content. Identical to {@link checkPaymentCookie};
 * kept as a separate async export so server components and the proxy can share
 * one intent-revealing name. Swap in a database lookup here if you need to
 * support revocation or refunds.
 */
export async function checkPaymentAccess(
  source: NextRequest | TCookieReader,
  contentId: string,
): Promise<boolean> {
  return checkPaymentCookie(source, contentId);
}

export function setPaymentCookie(
  response: NextResponse,
  contentId: string,
): NextResponse {
  response.cookies.set(PAYMENT_COOKIE_NAME, buildAccessToken(contentId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: PAYMENT_COOKIE_MAX_AGE,
  });
  return response;
}

// ---------------------------------------------------------------------------
// Pending payment token (stateless)
//
// Returned to the client as `paymentId`. It carries the invoice payment hash
// (and amount/content) inside an HMAC-signed envelope, so `verifyPayment` can
// validate the preimage on *any* instance without sharing memory with the
// instance that created the invoice. A record is also written to the in-memory
// store, but only for demonstration — verification never depends on reading it.
// ---------------------------------------------------------------------------

type TPendingPayload = {
  contentId: string;
  paymentHash: string;
  amountSats: number;
  recordId?: string;
};

function buildPendingToken(payload: TPendingPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${data}.${signPayload(data)}`;
}

function parsePendingToken(token: string): TPendingPayload | null {
  const idx = token.lastIndexOf('.');
  if (idx < 0) return null;

  const data = token.slice(0, idx);
  const signature = token.slice(idx + 1);
  if (!signatureMatches(signature, signPayload(data))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString()) as TPendingPayload;
    if (!parsed.contentId || !parsed.paymentHash) return null;
    return parsed;
  } catch {
    return null;
  }
}

export type TGenerateInvoiceResult = {
  paymentId: string;
  invoice: string;
  amountSats: number;
  memo: string;
};

/**
 * Creates a real LNURL-pay invoice and returns a signed, self-describing
 * `paymentId` that the verify endpoint can validate without shared state.
 */
export async function generateInvoice(options: {
  contentId: string;
  amountSats?: number;
  memo?: string;
}): Promise<TGenerateInvoiceResult> {
  const amountSats = options.amountSats ?? getDemoGateSats();
  const memo = options.memo ?? `Unlock ${options.contentId}`;
  const lnurlAddress = getLnurlPayAddress();

  const { invoice } = await createLnurlPayInvoice(lnurlAddress, amountSats, memo);
  const paymentHash = getPaymentHashFromInvoice(invoice);

  // Best-effort persistence for the demo's "swap in your database" story.
  // Never gates access — the signed token below is the source of truth.
  let recordId: string | undefined;
  try {
    const record = await createPaymentRecord({
      contentId: options.contentId,
      invoice,
      paymentHash,
      amountSats,
      memo,
    });
    recordId = record.id;
  } catch {
    recordId = undefined;
  }

  const paymentId = buildPendingToken({
    contentId: options.contentId,
    paymentHash,
    amountSats,
    recordId,
  });

  return { paymentId, invoice, amountSats, memo };
}

export type TVerifyPaymentResult =
  | { valid: true; contentId: string; amountSats: number }
  | { valid: false; reason: string };

/**
 * Verifies a Lightning payment preimage against the payment hash carried in the
 * signed `paymentId` token. Fully stateless and serverless-safe.
 */
export async function verifyPayment(
  paymentId: string,
  preimage: string,
): Promise<TVerifyPaymentResult> {
  const payload = parsePendingToken(paymentId);
  if (!payload) {
    return { valid: false, reason: 'Invalid or tampered payment token' };
  }

  if (!verifyPreimage(preimage, payload.paymentHash)) {
    return { valid: false, reason: 'Invalid payment proof' };
  }

  // Best-effort: mark the demo record paid if it still lives on this instance.
  if (payload.recordId) {
    try {
      await markPaymentPaid(payload.recordId);
    } catch {
      // Ignore — the store is illustrative, not authoritative.
    }
  }

  return { valid: true, contentId: payload.contentId, amountSats: payload.amountSats };
}

export function findProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.find((route) => pathname.startsWith(route.path));
}
