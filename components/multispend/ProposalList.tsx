'use client';

import type { NostrEvent } from '../../lib/nostr';
import type { TMultispendProposal, TVoteDecision } from '../../lib/multispend-types';
import { MultispendProposal } from './MultispendProposal';

interface IProposalListProps {
  proposals: TMultispendProposal[];
  currentPubkey?: string | null;
  onVote?: (proposalId: string, vote: TVoteDecision, signedEvent: NostrEvent) => void;
  onExecute?: (proposalId: string) => void;
  executingId?: string | null;
  emptyMessage?: string;
}

export function ProposalList({
  proposals,
  currentPubkey = null,
  onVote,
  onExecute,
  executingId = null,
  emptyMessage = 'No open proposals.',
}: IProposalListProps) {
  if (proposals.length === 0) {
    return (
      <p className="text-sm leading-[1.65] text-[var(--color-text-subtle)]">{emptyMessage}</p>
    );
  }

  return (
    <ul className="space-y-4" aria-label="Multispend proposals">
      {proposals.map((proposal) => (
        <li key={proposal.id}>
          <MultispendProposal
            proposal={proposal}
            currentPubkey={currentPubkey}
            onVote={
              onVote
                ? (vote, signedEvent) => onVote(proposal.id, vote, signedEvent)
                : undefined
            }
            onExecute={onExecute ? () => onExecute(proposal.id) : undefined}
            isExecuting={executingId === proposal.id}
          />
        </li>
      ))}
    </ul>
  );
}
