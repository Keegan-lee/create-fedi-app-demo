'use client';

import ReactMarkdown from 'react-markdown';
import { pubkeyToHsl, pubkeyToNpub, truncateNpub } from '../../lib/nostr-utils';
import type { NostrEvent } from '../../lib/fedi-types';
import { ZapButton } from './ZapButton';

interface INoteCardProps {
  event: NostrEvent;
}

function formatNoteTime(createdAt: number): string {
  const date = new Date(createdAt * 1000);
  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Renders a single kind-1 note with Markdown-safe content and zap support.
 */
export function NoteCard({ event }: INoteCardProps) {
  const npub = pubkeyToNpub(event.pubkey);
  const displayNpub = truncateNpub(npub);
  const { h, s, l } = pubkeyToHsl(event.pubkey);

  return (
    <article
      className="rounded-xl px-4 py-3"
      style={{
        background: 'var(--color-surface-1)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <header className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-8 w-8 shrink-0 rounded-full"
            style={{ background: `hsl(${h} ${s}% ${l}%)` }}
            aria-hidden
          />
          <div className="min-w-0">
            <p className="truncate font-mono text-xs text-[var(--color-text)]">{displayNpub}</p>
            <time
              className="text-xs text-[var(--color-text-subtle)]"
              dateTime={new Date(event.created_at * 1000).toISOString()}
            >
              {formatNoteTime(event.created_at)}
            </time>
          </div>
        </div>
        <ZapButton noteId={event.id} notePubkey={event.pubkey} />
      </header>

      <div
        className="prose prose-invert prose-sm max-w-none text-sm leading-[1.65] prose-p:my-1 prose-pre:my-2 prose-pre:rounded-md prose-pre:bg-[var(--color-surface-2)] prose-code:text-[var(--color-accent)] prose-code:before:content-none prose-code:after:content-none"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <ReactMarkdown>{event.content || '…'}</ReactMarkdown>
      </div>
    </article>
  );
}
