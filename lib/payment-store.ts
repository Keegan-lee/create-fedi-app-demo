import { randomBytes } from 'crypto';

export type TPaymentStatus = 'pending' | 'paid' | 'expired';

export type TPaymentRecord = {
  id: string;
  contentId: string;
  invoice: string;
  paymentHash: string;
  amountSats: number;
  memo: string;
  status: TPaymentStatus;
  createdAt: number;
  paidAt: number | null;
  metadata?: Record<string, string>;
};

const payments = new Map<string, TPaymentRecord>();
const INVOICE_TTL_MS = 60 * 60 * 1000;

function generateId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Creates a pending payment record. Uses in-memory storage by default;
 * when DATABASE_URL is set and lib/db exists, the database module can extend this.
 */
export async function createPaymentRecord(options: {
  contentId: string;
  invoice: string;
  paymentHash: string;
  amountSats: number;
  memo: string;
  metadata?: Record<string, string>;
}): Promise<TPaymentRecord> {
  const id = generateId();
  const record: TPaymentRecord = {
    id,
    contentId: options.contentId,
    invoice: options.invoice,
    paymentHash: options.paymentHash,
    amountSats: options.amountSats,
    memo: options.memo,
    status: 'pending',
    createdAt: Date.now(),
    paidAt: null,
    metadata: options.metadata,
  };

  payments.set(id, record);
  return record;
}

export async function getPaymentById(id: string): Promise<TPaymentRecord | null> {
  const record = payments.get(id);
  if (!record) return null;

  if (
    record.status === 'pending' &&
    Date.now() - record.createdAt > INVOICE_TTL_MS
  ) {
    record.status = 'expired';
    payments.set(id, record);
  }

  return record;
}

export async function markPaymentPaid(id: string): Promise<TPaymentRecord | null> {
  const record = await getPaymentById(id);
  if (!record || record.status !== 'pending') return null;

  record.status = 'paid';
  record.paidAt = Date.now();
  payments.set(id, record);
  return record;
}

export async function hasPaidForContent(contentId: string): Promise<boolean> {
  for (const record of payments.values()) {
    if (record.contentId === contentId && record.status === 'paid') {
      return true;
    }
  }
  return false;
}
