import { NextResponse } from 'next/server';
import { setPaymentCookie, verifyPayment } from '../../../../lib/payment-gate';

export async function POST(request: Request) {
  let body: { paymentId?: string; preimage?: string; contentId?: string };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { paymentId, preimage, contentId } = body;

  if (!paymentId || !preimage || !contentId) {
    return NextResponse.json(
      { error: 'paymentId, preimage, and contentId are required' },
      { status: 400 },
    );
  }

  const result = await verifyPayment(paymentId, preimage);
  if (!result.valid) {
    return NextResponse.json({ error: result.reason }, { status: 402 });
  }

  if (result.contentId !== contentId) {
    return NextResponse.json({ error: 'Content mismatch' }, { status: 403 });
  }

  const response = NextResponse.json({
    ok: true,
    contentId: result.contentId,
    amountSats: result.amountSats,
  });

  setPaymentCookie(response, contentId);
  return response;
}
