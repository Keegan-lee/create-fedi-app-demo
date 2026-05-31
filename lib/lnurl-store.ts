import { randomBytes } from 'crypto';

export type TLnurlAuthSession = {
  k1: string;
  createdAt: number;
  expiresAt: number;
  pubkey: string | null;
  authenticatedAt: number | null;
};

export type TLnurlWithdrawSession = {
  k1: string;
  createdAt: number;
  expiresAt: number;
  withdrawnMsats: number | null;
  paymentRequest: string | null;
};

const authSessions = new Map<string, TLnurlAuthSession>();
const withdrawSessions = new Map<string, TLnurlWithdrawSession>();

const AUTH_TTL_MS = 10 * 60 * 1000;
const WITHDRAW_TTL_MS = 10 * 60 * 1000;

function generateK1(): string {
  return randomBytes(32).toString('hex');
}

function buildMockInvoice(amountSats: number, id: string): string {
  const amountPart = amountSats.toString(16).padStart(6, '0');
  return `lnbc${amountPart}n1p${id.slice(0, 40)}`;
}

export function createAuthSession(): TLnurlAuthSession {
  const k1 = generateK1();
  const now = Date.now();
  const session: TLnurlAuthSession = {
    k1,
    createdAt: now,
    expiresAt: now + AUTH_TTL_MS,
    pubkey: null,
    authenticatedAt: null,
  };
  authSessions.set(k1, session);
  return session;
}

export function getAuthSession(k1: string): TLnurlAuthSession | null {
  const session = authSessions.get(k1);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    authSessions.delete(k1);
    return null;
  }
  return session;
}

export function completeAuthSession(k1: string, pubkey: string): TLnurlAuthSession | null {
  const session = getAuthSession(k1);
  if (!session) return null;
  session.pubkey = pubkey;
  session.authenticatedAt = Date.now();
  authSessions.set(k1, session);
  return session;
}

export function createWithdrawSession(): TLnurlWithdrawSession {
  const k1 = generateK1();
  const now = Date.now();
  const session: TLnurlWithdrawSession = {
    k1,
    createdAt: now,
    expiresAt: now + WITHDRAW_TTL_MS,
    withdrawnMsats: null,
    paymentRequest: null,
  };
  withdrawSessions.set(k1, session);
  return session;
}

export function getWithdrawSession(k1: string): TLnurlWithdrawSession | null {
  const session = withdrawSessions.get(k1);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    withdrawSessions.delete(k1);
    return null;
  }
  return session;
}

export function completeWithdrawSession(
  k1: string,
  paymentRequest: string,
  amountMsats: number,
): TLnurlWithdrawSession | null {
  const session = getWithdrawSession(k1);
  if (!session) return null;
  session.paymentRequest = paymentRequest;
  session.withdrawnMsats = amountMsats;
  withdrawSessions.set(k1, session);
  return session;
}

/**
 * Creates a mock BOLT11 invoice for LNURL-pay callbacks.
 * Replace with your Lightning node / LND / CLN integration in production.
 */
export function createLnurlPayInvoice(amountMsats: number, username: string): string {
  const amountSats = Math.max(1, Math.floor(amountMsats / 1000));
  const id = randomBytes(8).toString('hex');
  return buildMockInvoice(amountSats, `${username}-${id}`);
}
