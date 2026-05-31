/** Default LNURL-pay address for create-fedi-app demo payments (maintainer wallet). */
export const DEFAULT_LNURL_PAY_ADDRESS =
  'lnurl1dp68gurn8ghj7un9vd6hyunfdenkgtnrw3exytnfduhkcmnkxyhhqctevdhkgetn9uenzvmxv33kyefj8yerqefk8p3rvd34x93nvdr9vvukgcfexcergv3jxc6kgcm9x4jxydenxvengwf48q6rxwpsxf3ryctpvvenwefswhw4au';

export const PUBLIC_FEDI_APP_REPO = 'https://github.com/keegan-lee/public-fedi-app';

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Server-side LNURL-pay address for invoice generation. */
export function getLnurlPayAddress(): string {
  return (
    process.env.LNURL_PAY_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_LNURL_PAY_ADDRESS?.trim() ||
    DEFAULT_LNURL_PAY_ADDRESS
  );
}

/** Client-safe LNURL-pay address for display and QR codes. */
export function getPublicLnurlPayAddress(): string {
  return (
    process.env.NEXT_PUBLIC_LNURL_PAY_ADDRESS?.trim() ||
    DEFAULT_LNURL_PAY_ADDRESS
  );
}

export function getDemoWeblnSats(): number {
  return parsePositiveInt(
    process.env.NEXT_PUBLIC_DEMO_WEBLN_SATS ?? process.env.DEMO_WEBLN_SATS,
    21,
  );
}

export function getDemoGateSats(): number {
  return parsePositiveInt(
    process.env.NEXT_PUBLIC_DEMO_GATE_SATS ?? process.env.DEMO_GATE_SATS,
    7,
  );
}

export function getDemoLnurlSats(): number {
  return parsePositiveInt(
    process.env.NEXT_PUBLIC_DEMO_LNURL_SATS ?? process.env.DEMO_LNURL_SATS,
    1,
  );
}

/** Truncates an LNURL string for compact UI display. */
export function truncateLnurl(lnurl: string): string {
  if (lnurl.length <= 36) return lnurl;
  return `${lnurl.slice(0, 24)}…${lnurl.slice(-12)}`;
}
