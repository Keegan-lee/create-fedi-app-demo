import type { Metadata } from 'next';
import { MultispendDemoClient } from './MultispendDemoClient';

export const metadata: Metadata = {
  title: 'Multispend',
  description:
    'Mock Multispend workflow for Fedi mini apps. Create spending proposals, collect Nostr-signed approvals, and simulate threshold execution for shared wallets.',
  openGraph: {
    title: 'Multispend',
    description:
      'Mock Multispend workflow for Fedi mini apps. Create spending proposals, collect Nostr-signed approvals, and simulate threshold execution for shared wallets.',
  },
  twitter: {
    card: 'summary',
    title: 'Multispend',
    description:
      'Mock Multispend workflow for Fedi mini apps. Create spending proposals, collect Nostr-signed approvals, and simulate threshold execution for shared wallets.',
  },
};

export default function MultispendDemoPage() {
  return <MultispendDemoClient />;
}
