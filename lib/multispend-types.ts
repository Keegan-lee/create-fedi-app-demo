import type { NostrEvent } from '../lib/nostr';

export type TProposalStatus = 'open' | 'approved' | 'rejected' | 'executed';

export type TVoteDecision = 'approve' | 'reject';

/** Demo kind for Multispend approval votes signed via Nostr. */
export const MULTISPEND_VOTE_KIND = 38383;

export type TMultispendProposal = {
  id: string;
  amountSats: number;
  description: string;
  requiredSigners: string[];
  threshold: number;
  approvals: string[];
  rejections: string[];
  status: TProposalStatus;
  createdAt: number;
  proposerPubkey: string;
};

export type TMultispendVote = {
  proposalId: string;
  voterPubkey: string;
  vote: TVoteDecision;
  signedEvent: NostrEvent;
};

export type TMockVoter = {
  pubkey: string;
  label: string;
};
