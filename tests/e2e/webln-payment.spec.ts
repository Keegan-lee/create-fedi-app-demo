import { test, expect } from '@playwright/test';

/**
 * Full WebLN payment flow using the dev MockWebLNProvider (enabled by default in Providers).
 * InvoiceCard generates an invoice; PayButton pays it; success states appear in the UI.
 */
test('webln demo: generate invoice, pay, and see success', async ({ page }) => {
  await page.goto('/demo/webln');

  await expect(page.getByRole('heading', { name: 'WebLN Payments' })).toBeVisible();

  await page.getByRole('button', { name: /create invoice/i }).click();

  // Wait for invoice generation and QR to appear
  await expect(page.getByRole('button', { name: /copy invoice/i })).toBeVisible({
    timeout: 10_000,
  });

  // Pay the generated invoice
  const payButton = page.getByRole('button', { name: /pay 21 sats/i });
  await expect(payButton).toBeEnabled({ timeout: 10_000 });
  await payButton.click();

  // Success state with preimage
  await expect(page.getByRole('status', { name: /payment of 21 sats sent successfully/i })).toBeVisible({
    timeout: 10_000,
  });

  // Payment appears in local history
  await expect(page.getByLabel('Recent payments')).toBeVisible();
  await expect(page.getByText('Sent')).toBeVisible();
});

test('webln demo: how this works section expands', async ({ page }) => {
  await page.goto('/demo/webln');

  const toggle = page.getByRole('button', { name: 'How this works' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText(/WebLN is a JavaScript standard/i)).toBeVisible();
});
