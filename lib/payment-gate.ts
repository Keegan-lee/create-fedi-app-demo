import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getPaymentHashFromInvoice } from './lightning/bolt11';
import { createLnurlPayInvoice } from './lightning/lnurl-pay';
import { verifyPreimage } from './lightning/preimage-verify';
import { getDemoGateSats, getLnurlPayAddress } from './payment-config';
import {
  createPaymentRecord,
  getPaymentById,
  markPaymentPaid,
  type TPaymentRecord,
} from './payment-store';

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

function buildToken(contentId: string, paymentId: string): string {
  const payload = `${contentId}:${paymentId}`;
  return `${payload}:${signPayload(payload)}`;
}

function parseToken(token: string, contentId: string): string | null {
  const parts = token.split(':');
  if (parts.length < 3) return null;

  const paymentId = parts[1];
  const signature = parts.slice(2).join(':');
  const payload = `${contentId}:${paymentId}`;
  const expected = signPayload(payload);

  try {
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return paymentId;
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
 * Reads payment tokens from request cookies or the x-payment-token header.
 */
export function checkPaymentCookie(
  source: NextRequest | TCookieReader,
  contentId: string,
): boolean {
  const token = readPaymentToken(source);
  if (!token) return false;

  const paymentId = parseToken(token, contentId);
  if (!paymentId) return false;

  return true;
}

/**
 * Validates the token and confirms the underlying payment record is paid.
 */
export async function checkPaymentAccess(
  source: NextRequest | TCookieReader,
  contentId: string,
): Promise<boolean> {
  const token = readPaymentToken(source);
  if (!token) return false;

  const paymentId = parseToken(token, contentId);
  if (!paymentId) return false;

  const record = await getPaymentById(paymentId);
  return record?.contentId === contentId && record.status === 'paid';
}

export function setPaymentCookie(
  response: NextResponse,
  contentId: string,
  paymentId: string,
): NextResponse {
  const token = buildToken(contentId, paymentId);
  response.cookies.set(PAYMENT_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: PAYMENT_COOKIE_MAX_AGE,
  });
  return response;
}

export type TGenerateInvoiceResult = {
  paymentId: string;
  invoice: string;
  amountSats: number;
  memo: string;
};

/**
 * Creates a real LNURL-pay invoice and stores a pending payment record.
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

  const record = await createPaymentRecord({
    contentId: options.contentId,
    invoice,
    paymentHash,
    amountSats,
    memo,
  });

  return {
    paymentId: record.id,
    invoice: record.invoice,
    amountSats: record.amountSats,
    memo: record.memo,
  };
}

export type TVerifyPaymentResult =
  | { valid: true; record: TPaymentRecord }
  | { valid: false; reason: string };

/**
 * Verifies a Lightning payment preimage against the invoice payment hash.
 */
export async function verifyPayment(
  paymentId: string,
  preimage: string,
): Promise<TVerifyPaymentResult> {
  const record = await getPaymentById(paymentId);
  if (!record) {
    return { valid: false, reason: 'Payment not found' };
  }

  if (record.status === 'expired') {
    return { valid: false, reason: 'Invoice expired' };
  }

  if (record.status === 'paid') {
    return { valid: true, record };
  }

  if (!verifyPreimage(preimage, record.paymentHash)) {
    return { valid: false, reason: 'Invalid payment proof' };
  }

  const paid = await markPaymentPaid(paymentId);
  if (!paid) {
    return { valid: false, reason: 'Unable to confirm payment' };
  }

  return { valid: true, record: paid };
}

export function findProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.find((route) => pathname.startsWith(route.path));
}
