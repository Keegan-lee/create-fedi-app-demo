import type { Metadata } from 'next';
import { NostrFeedDemoClient } from './NostrFeedDemoClient';

export const metadata: Metadata = {
  title: 'Nostr feed',
  description:
    'Live Nostr social feed for Fedi mini apps. Read kind-1 notes from public relays, publish signed posts, and zap creators with WebLN and NIP-57.',
  openGraph: {
    title: 'Nostr feed',
    description:
      'Live Nostr social feed for Fedi mini apps. Read kind-1 notes from public relays, publish signed posts, and zap creators with WebLN and NIP-57.',
  },
  twitter: {
    card: 'summary',
    title: 'Nostr feed',
    description:
      'Live Nostr social feed for Fedi mini apps. Read kind-1 notes from public relays, publish signed posts, and zap creators with WebLN and NIP-57.',
  },
};

export default function NostrFeedDemoPage() {
  return <NostrFeedDemoClient />;
}
