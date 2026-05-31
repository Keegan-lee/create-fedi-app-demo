'use client';

import { useCallback, useEffect, useState } from 'react';
import type { NostrEvent } from '../../lib/fedi-types';
import { useNostrFeed } from './NostrFeedProvider';
import { NoteCard } from './NoteCard';

const FEED_LIMIT = 50;

/**
 * Subscribes to kind-1 text notes from configured relays and renders a scrollable feed.
 */
export function NoteFeed() {
  const { relayUrls, manager } = useNostrFeed();
  const [notes, setNotes] = useState<NostrEvent[]>([]);
  const [status, setStatus] = useState<'loading' | 'live' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const upsertNote = useCallback((event: NostrEvent) => {
    setNotes((prev) => {
      if (prev.some((n) => n.id === event.id)) return prev;
      const next = [event, ...prev];
      next.sort((a, b) => b.created_at - a.created_at);
      return next.slice(0, FEED_LIMIT);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setErrorMessage(null);

    const since = Math.floor(Date.now() / 1000) - 60 * 60 * 24;

    manager
      .query(relayUrls, { kinds: [1], limit: FEED_LIMIT, since }, 8000)
      .then((initial) => {
        if (cancelled) return;
        const sorted = [...initial].sort((a, b) => b.created_at - a.created_at);
        setNotes(sorted.slice(0, FEED_LIMIT));
        setStatus('live');
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to load feed');
      });

    const unsubscribe = manager.subscribe(
      relayUrls,
      { kinds: [1], since },
      {
        onEvent: upsertNote,
        onEose: () => {
          if (!cancelled) setStatus((s) => (s === 'loading' ? 'live' : s));
        },
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [manager, relayUrls, upsertNote]);

  if (status === 'error') {
    return (
      <p className="text-sm text-[var(--color-error,#ef4444)]" role="alert">
        {errorMessage ?? 'Could not connect to relays'}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
          Feed
        </p>
        <span
          className="font-mono text-xs text-[var(--color-text-subtle)]"
          aria-live="polite"
        >
          {status === 'loading' ? 'Connecting…' : `${notes.length} notes`}
        </span>
      </div>

      <div
        className="flex max-h-[min(60dvh,28rem)] flex-col gap-3 overflow-y-auto overscroll-contain pr-1"
        aria-busy={status === 'loading'}
        aria-label="Nostr note feed"
      >
        {notes.length === 0 && status === 'loading' && (
          <p className="text-sm text-[var(--color-text-muted)]">Loading notes from relays…</p>
        )}

        {notes.length === 0 && status === 'live' && (
          <p className="text-sm text-[var(--color-text-muted)]">
            No notes yet. Publish one below. It may take a few seconds to appear.
          </p>
        )}

        {notes.map((note) => (
          <NoteCard key={note.id} event={note} />
        ))}
      </div>
    </div>
  );
}
