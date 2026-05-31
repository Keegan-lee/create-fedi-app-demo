'use client';

import { useState } from 'react';
import { useIdentity } from '../../lib/nostr';
import type { NostrEvent } from '../../lib/nostr';
import { MULTISPEND_VOTE_KIND, type TVoteDecision } from '../../lib/multispend-types';

interface IApprovalVoteProps {
  proposalId: string;
  voterPubkey: string;
  currentPubkey: string | null;
  disabled?: boolean;
  onVote: (vote: TVoteDecision, signedEvent: NostrEvent) => void;
}

export function ApprovalVote({
  proposalId,
  voterPubkey,
  currentPubkey,
  disabled = false,
  onVote,
}: IApprovalVoteProps) {
  const { signEvent, isConnecting } = useIdentity();
  const [isVoting, setIsVoting] = useState(false);
  const [voteError, setVoteError] = useState<Error | null>(null);
  const [lastVote, setLastVote] = useState<TVoteDecision | null>(null);

  const isCurrentVoter = currentPubkey === voterPubkey;

  async function castVote(vote: TVoteDecision) {
    if (!currentPubkey || !isCurrentVoter) return;

    setIsVoting(true);
    setVoteError(null);

    try {
      const signedEvent = await signEvent({
        kind: MULTISPEND_VOTE_KIND,
        content: JSON.stringify({ proposalId, vote }),
        tags: [
          ['d', proposalId],
          ['vote', vote],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });

      if (!signedEvent) {
        setVoteError(new Error('Could not sign vote. Connect your Nostr identity first.'));
        return;
      }

      setLastVote(vote);
      onVote(vote, signedEvent);
    } catch (err) {
      setVoteError(err instanceof Error ? err : new Error('Vote signing failed'));
    } finally {
      setIsVoting(false);
    }
  }

  if (!isCurrentVoter) {
    return null;
  }

  if (lastVote) {
    return (
      <p
        className="text-xs font-medium"
        style={{ color: lastVote === 'approve' ? 'var(--color-accent)' : 'var(--color-error, #ef4444)' }}
        role="status"
      >
        You {lastVote === 'approve' ? 'approved' : 'rejected'} this proposal via Nostr signature.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => castVote('approve')}
          disabled={disabled || isVoting || isConnecting}
          className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-80 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-primary-foreground)',
            borderRadius: 'var(--radius-md)',
          }}
          aria-label="Approve spending proposal"
        >
          {isVoting ? 'Signing…' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={() => castVote('reject')}
          disabled={disabled || isVoting || isConnecting}
          className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-80 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            borderRadius: 'var(--radius-md)',
          }}
          aria-label="Reject spending proposal"
        >
          Reject
        </button>
      </div>
          <p className="text-xs leading-[1.65] text-[var(--color-text-subtle)]">
            Votes are signed with{' '}
            <code className="font-mono text-[11px]">signEvent()</code> (kind {MULTISPEND_VOTE_KIND}).
            Mock co-voters auto-approve after your signature so you can complete the demo flow.
          </p>
      {voteError && (
        <p className="text-xs text-[var(--color-error,#ef4444)]" role="alert">
          {voteError.message}
        </p>
      )}
    </div>
  );
}
