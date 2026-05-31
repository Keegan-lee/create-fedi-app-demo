'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import {
  closeRelayManager,
  getRelayManager,
  resolveRelayUrls,
  type RelayManager,
} from '../../lib/nostr/relay';

interface INostrFeedContext {
  relayUrls: string[];
  manager: RelayManager;
}

const NostrFeedContext = createContext<INostrFeedContext | null>(null);

interface INostrFeedProviderProps {
  children: ReactNode;
  relayUrls?: string[];
}

export function NostrFeedProvider({ children, relayUrls }: INostrFeedProviderProps) {
  const urls = useMemo(
    () => (relayUrls?.length ? relayUrls : resolveRelayUrls()),
    [relayUrls],
  );
  const manager = useMemo(() => getRelayManager(), []);

  useEffect(() => {
    return () => closeRelayManager();
  }, []);

  return (
    <NostrFeedContext.Provider value={{ relayUrls: urls, manager }}>
      {children}
    </NostrFeedContext.Provider>
  );
}

export function useNostrFeed(): INostrFeedContext {
  const ctx = useContext(NostrFeedContext);
  if (!ctx) {
    throw new Error('useNostrFeed must be used within NostrFeedProvider');
  }
  return ctx;
}
