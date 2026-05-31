import type { TMockVoter, TMultispendProposal } from './multispend-types';

/** Mock voter pubkeys for the demo. Real Multispend uses Fedi group members. */
export const MOCK_VOTERS: TMockVoter[] = [
  {
    pubkey: '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    label: 'Alice',
  },
  {
    pubkey: 'c6047f9441ed7d6d3045406e95e0aa2944fef797332e9cb0f5c85d8d280e47bd',
    label: 'Bob',
  },
  {
    pubkey: 'f9308a3192592395af7d9b875b252fe1840d59a1363c88b9b5c6a7767632b87',
    label: 'Carol',
  },
];

export function getMockVoterLabel(pubkey: string): string {
  const voter = MOCK_VOTERS.find((v) => v.pubkey === pubkey);
  return voter?.label ?? 'Voter';
}

export function createProposalId(): string {
  return `prop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getApprovalCount(proposal: TMultispendProposal): number {
  return proposal.approvals.length;
}

export function isThresholdMet(proposal: TMultispendProposal): boolean {
  return proposal.approvals.length >= proposal.threshold;
}

export function hasVoted(proposal: TMultispendProposal, pubkey: string): boolean {
  return proposal.approvals.includes(pubkey) || proposal.rejections.includes(pubkey);
}

export function getInitialProposals(): TMultispendProposal[] {
  const [alice, bob, carol] = MOCK_VOTERS;

  return [
    {
      id: 'prop-seed-lunch',
      amountSats: 42_000,
      description: 'Team lunch: reimburse catering for the sprint retro',
      requiredSigners: [alice.pubkey, bob.pubkey, carol.pubkey],
      threshold: 2,
      approvals: [],
      rejections: [],
      status: 'open',
      createdAt: Date.now() - 3_600_000,
      proposerPubkey: alice.pubkey,
    },
    {
      id: 'prop-seed-supplies',
      amountSats: 15_000,
      description: 'Shared office supplies: printer paper and markers',
      requiredSigners: [alice.pubkey, bob.pubkey, carol.pubkey],
      threshold: 2,
      approvals: [alice.pubkey, bob.pubkey],
      rejections: [],
      status: 'approved',
      createdAt: Date.now() - 86_400_000,
      proposerPubkey: bob.pubkey,
    },
  ];
}
