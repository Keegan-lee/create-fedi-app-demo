'use client';

import { useState } from 'react';
import { useIdentity } from '../../lib/nostr';
import { useNostrFeed } from './NostrFeedProvider';

/**
 * Text input and publish button: signs a kind-1 note and sends it to relays.
 */
export function PublishNote() {
  const { relayUrls, manager } = useNostrFeed();
  const { pubkey, signEvent, isConnecting } = useIdentity();
  const [content, setContent] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [lastPublishedId, setLastPublishedId] = useState<string | null>(null);

  async function handlePublish() {
    const text = content.trim();
    if (!text || !pubkey) return;

    setIsPublishing(true);
    setPublishError(null);

    try {
      const signed = await signEvent({
        kind: 1,
        content: text,
        tags: [],
        created_at: Math.floor(Date.now() / 1000),
      });

      if (!signed) {
        throw new Error('Connect your Nostr identity to publish');
      }

      await manager.publish(relayUrls, signed);
      setLastPublishedId(signed.id);
      setContent('');
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setIsPublishing(false);
    }
  }

  if (!pubkey) {
    return (
      <p className="text-sm text-[var(--color-text-subtle)]">
        Connect your Nostr identity (NIP-07) to publish notes to the relay.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
          New note
        </span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="What's happening?"
          className="w-full resize-none rounded-lg px-3 py-2 text-sm"
          style={{
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            borderRadius: 'var(--radius-md)',
          }}
        />
      </label>

      <button
        type="button"
        onClick={handlePublish}
        disabled={!content.trim() || isPublishing || isConnecting}
        className="self-start rounded-lg px-4 py-2 text-sm font-semibold transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-80 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          background: 'var(--color-accent)',
          color: 'var(--color-primary-foreground)',
          borderRadius: 'var(--radius-md)',
        }}
        aria-label="Publish note to Nostr relays"
      >
        {isPublishing ? 'Publishing…' : 'Publish'}
      </button>

      {publishError && (
        <p className="text-xs text-[var(--color-error,#ef4444)]" role="alert">
          {publishError}
        </p>
      )}

      {lastPublishedId && !publishError && (
        <p className="text-xs text-[var(--color-text-subtle)]" role="status">
          Published. Waiting for relays to echo your note.
        </p>
      )}
    </div>
  );
}
