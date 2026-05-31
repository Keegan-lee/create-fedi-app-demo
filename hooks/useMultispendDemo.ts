'use client';

import { useCallback, useState } from 'react';
import type { NostrEvent } from '../lib/nostr';
import {
  createProposalId,
  getInitialProposals,
  hasVoted,
  isThresholdMet,
  MOCK_VOTERS,
} from '../lib/multispend-utils';
import type { TMultispendProposal, TMultispendVote, TProposalStatus, TVoteDecision } from '../lib/multispend-types';

export function useMultispendDemo() {
  const [proposals, setProposals] = useState<TMultispendProposal[]>(() => getInitialProposals());
  const [votes, setVotes] = useState<TMultispendVote[]>([]);
  const [lastSignedEvent, setLastSignedEvent] = useState<NostrEvent | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);

  const createProposal = useCallback(
    (input: { amountSats: number; description: string; proposerPubkey: string }) => {
      const signers = [
        input.proposerPubkey,
        ...MOCK_VOTERS.map((v) => v.pubkey).filter((pk) => pk !== input.proposerPubkey),
      ].slice(0, 3);

      const threshold = Math.min(2, signers.length);
      const proposal: TMultispendProposal = {
        id: createProposalId(),
        amountSats: input.amountSats,
        description: input.description.trim(),
        requiredSigners: signers,
        threshold,
        approvals: [],
        rejections: [],
        status: 'open',
        createdAt: Date.now(),
        proposerPubkey: input.proposerPubkey,
      };

      setProposals((current) => [proposal, ...current]);
      return proposal;
    },
    [],
  );

  const recordVote = useCallback(
    (proposalId: string, voterPubkey: string, vote: TVoteDecision, signedEvent: NostrEvent) => {
      setLastSignedEvent(signedEvent);
      setVotes((current) => [
        ...current.filter((v) => !(v.proposalId === proposalId && v.voterPubkey === voterPubkey)),
        { proposalId, voterPubkey, vote, signedEvent },
      ]);

      setProposals((current) =>
        current.map((proposal) => {
          if (proposal.id !== proposalId || proposal.status !== 'open') return proposal;
          if (hasVoted(proposal, voterPubkey)) return proposal;

          let approvals =
            vote === 'approve'
              ? [...proposal.approvals, voterPubkey]
              : proposal.approvals;
          let rejections =
            vote === 'reject'
              ? [...proposal.rejections, voterPubkey]
              : proposal.rejections;

          // Demo: mock co-voters auto-approve after a real Nostr signature
          if (vote === 'approve' && approvals.length < proposal.threshold) {
            const mockCoSigner = proposal.requiredSigners.find(
              (pk) =>
                pk !== voterPubkey &&
                MOCK_VOTERS.some((m) => m.pubkey === pk) &&
                !approvals.includes(pk) &&
                !rejections.includes(pk),
            );
            if (mockCoSigner) {
              approvals = [...approvals, mockCoSigner];
            }
          }

          const allVoted =
            approvals.length + rejections.length >= proposal.requiredSigners.length;
          const rejected =
            rejections.length > proposal.requiredSigners.length - proposal.threshold;

          let status: TProposalStatus = proposal.status;
          if (isThresholdMet({ ...proposal, approvals })) {
            status = 'approved';
          } else if (rejected || (allVoted && !isThresholdMet({ ...proposal, approvals }))) {
            status = 'rejected';
          }

          return { ...proposal, approvals, rejections, status };
        }),
      );
    },
    [],
  );

  const simulateExecution = useCallback(async (proposalId: string) => {
    setExecutingId(proposalId);
    await new Promise((resolve) => window.setTimeout(resolve, 1200));
    setProposals((current) =>
      current.map((proposal) =>
        proposal.id === proposalId && proposal.status === 'approved'
          ? { ...proposal, status: 'executed' }
          : proposal,
      ),
    );
    setExecutingId(null);
  }, []);

  const openProposals = proposals.filter((p) => p.status === 'open' || p.status === 'approved');

  return {
    proposals,
    openProposals,
    votes,
    lastSignedEvent,
    executingId,
    createProposal,
    recordVote,
    simulateExecution,
  };
}
