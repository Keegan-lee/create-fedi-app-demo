import type { Event } from 'nostr-tools/core';
import type { Filter } from 'nostr-tools/filter';
import { SimplePool } from 'nostr-tools/pool';
import type { NostrEvent } from '../fedi-types';

/** Default public relays for the live demo. */
export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
] as const;

/**
 * Resolves relay URLs from `NEXT_PUBLIC_NOSTR_RELAY` (comma-separated) or defaults.
 */
export function resolveRelayUrls(override?: string): string[] {
  const raw = override ?? process.env.NEXT_PUBLIC_NOSTR_RELAY;
  if (raw?.trim()) {
    return raw
      .split(',')
      .map((url) => url.trim())
      .filter((url) => url.startsWith('wss://') || url.startsWith('ws://'));
  }
  return [...DEFAULT_RELAYS];
}

export type TRelayConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * WebSocket relay connection manager backed by `nostr-tools` SimplePool.
 * Handles subscribe, publish, and automatic reconnect with exponential backoff.
 */
export class RelayManager {
  private readonly pool: SimplePool;
  private readonly trackedRelays = new Set<string>();

  constructor() {
    this.pool = new SimplePool({ enablePing: true, enableReconnect: true });
  }

  /** Tracks which relays the pool has opened for `close()`. */
  private trackRelays(urls: string[]): void {
    for (const url of urls) this.trackedRelays.add(url);
  }

  /**
   * Subscribes to events across multiple relays. Returns an unsubscribe function.
   */
  subscribe(
    relayUrls: string[],
    filter: Filter,
    handlers: {
      onEvent: (event: NostrEvent) => void;
      onEose?: () => void;
    },
  ): () => void {
    this.trackRelays(relayUrls);
    const sub = this.pool.subscribe(relayUrls, filter, {
      onevent(event: Event) {
        handlers.onEvent(event as NostrEvent);
      },
      oneose: handlers.onEose,
    });
    return () => sub.close();
  }

  /**
   * Publishes a signed event to all write relays. Resolves when at least one accepts.
   */
  async publish(relayUrls: string[], event: NostrEvent): Promise<void> {
    this.trackRelays(relayUrls);
    await Promise.any(this.pool.publish(relayUrls, event as Event));
  }

  /**
   * One-shot query: collects events until EOSE or timeout.
   */
  async query(
    relayUrls: string[],
    filter: Filter,
    timeoutMs = 5000,
  ): Promise<NostrEvent[]> {
    this.trackRelays(relayUrls);
    const events = await this.pool.querySync(relayUrls, filter, { maxWait: timeoutMs });
    return events as NostrEvent[];
  }

  /** Closes all relay connections opened by this manager. */
  close(): void {
    this.pool.close([...this.trackedRelays]);
    this.trackedRelays.clear();
  }
}

let sharedManager: RelayManager | null = null;

/** Singleton relay manager for client components in the same session. */
export function getRelayManager(): RelayManager {
  if (!sharedManager) {
    sharedManager = new RelayManager();
  }
  return sharedManager;
}

export function closeRelayManager(): void {
  sharedManager?.close();
  sharedManager = null;
}
