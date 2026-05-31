'use client';

import { formatSats } from '../../lib/fedi';
import { pubkeyToHsl, pubkeyToNpub, truncateNpub } from '../../lib/nostr-utils';
import type { NostrEvent } from '../../lib/nostr';
import type { TMultispendProposal, TVoteDecision } from '../../lib/multispend-types';
import { getApprovalCount, getMockVoterLabel } from '../../lib/multispend-utils';
import { ApprovalVote } from './ApprovalVote';

interface IMultispendProposalProps {
  proposal: TMultispendProposal;
  currentPubkey?: string | null;
  onVote?: (vote: TVoteDecision, signedEvent: NostrEvent) => void;
  onExecute?: () => void;
  isExecuting?: boolean;
}

const STATUS_LABELS: Record<TMultispendProposal['status'], string> = {
  open: 'Awaiting votes',
  approved: 'Threshold met',
  rejected: 'Rejected',
  executed: 'Executed',
};

export function MultispendProposal({
  proposal,
  currentPubkey = null,
  onVote,
  onExecute,
  isExecuting = false,
}: IMultispendProposalProps) {
  const approvalCount = getApprovalCount(proposal);
  const progress = Math.min(100, (approvalCount / proposal.threshold) * 100);

  return (
    <article
      className="space-y-4 rounded-xl p-4"
      style={{
        background: 'var(--color-surface-1)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
      aria-label={`Spending proposal: ${proposal.description}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight text-[var(--color-text)]">
            {formatSats(proposal.amountSats)}
          </p>
          <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
            {proposal.description}
          </p>
        </div>
        <span
          className="shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{
            background:
              proposal.status === 'executed'
                ? 'var(--color-accent-dim)'
                : proposal.status === 'rejected'
                  ? 'color-mix(in srgb, var(--color-error, #ef4444) 15%, transparent)'
                  : 'var(--color-surface-2, var(--color-bg))',
            color:
              proposal.status === 'executed'
                ? 'var(--color-accent)'
                : proposal.status === 'rejected'
                  ? 'var(--color-error, #ef4444)'
                  : 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
          }}
        >
          {STATUS_LABELS[proposal.status]}
        </span>
      </header>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
            Approvals
          </span>
          <span className="font-mono text-[var(--color-text-muted)]">
            {approvalCount} / {proposal.threshold} required
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full"
          style={{ background: 'var(--color-surface-2, var(--color-bg))' }}
          role="progressbar"
          aria-valuenow={approvalCount}
          aria-valuemin={0}
          aria-valuemax={proposal.threshold}
          aria-label={`${approvalCount} of ${proposal.threshold} approvals collected`}
        >
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              width: `${progress}%`,
              background: 'var(--color-accent)',
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
          Required signers
        </p>
        <ul className="space-y-2" aria-label="Required signers">
          {proposal.requiredSigners.map((signerPubkey) => {
            const approved = proposal.approvals.includes(signerPubkey);
            const rejected = proposal.rejections.includes(signerPubkey);
            const isYou = currentPubkey === signerPubkey;
            const { h, s, l } = pubkeyToHsl(signerPubkey);
            const label = isYou ? 'You' : getMockVoterLabel(signerPubkey);
            const npub = truncateNpub(pubkeyToNpub(signerPubkey));

            return (
              <li
                key={signerPubkey}
                className="flex items-center gap-3 rounded-lg px-3 py-2"
                style={{
                  background: 'var(--color-surface-2, var(--color-bg))',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: `hsl(${h}, ${s}%, ${l}%)`,
                    color: 'var(--color-primary-foreground)',
                  }}
                  aria-hidden
                >
                  {label.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {label}
                    {isYou && (
                      <span className="ml-1.5 text-xs font-normal text-[var(--color-text-muted)]">
                        (your key)
                      </span>
                    )}
                  </p>
                  <p className="truncate font-mono text-xs text-[var(--color-text-subtle)]">{npub}</p>
                </div>
                <span
                  className="shrink-0 text-xs font-semibold"
                  style={{
                    color: approved
                      ? 'var(--color-accent)'
                      : rejected
                        ? 'var(--color-error, #ef4444)'
                        : 'var(--color-text-subtle)',
                  }}
                >
                  {approved ? 'Approved' : rejected ? 'Rejected' : 'Pending'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {proposal.status === 'open' &&
        currentPubkey &&
        proposal.requiredSigners.includes(currentPubkey) &&
        !proposal.approvals.includes(currentPubkey) &&
        !proposal.rejections.includes(currentPubkey) &&
        onVote && (
          <ApprovalVote
            proposalId={proposal.id}
            voterPubkey={currentPubkey}
            currentPubkey={currentPubkey}
            onVote={onVote}
          />
        )}

      {proposal.status === 'approved' && onExecute && (
        <button
          type="button"
          onClick={onExecute}
          disabled={isExecuting}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-80 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-primary-foreground)',
            borderRadius: 'var(--radius-md)',
          }}
          aria-busy={isExecuting}
        >
          {isExecuting ? 'Executing withdrawal…' : 'Simulate execution'}
        </button>
      )}

      {proposal.status === 'executed' && (
        <p
          className="rounded-lg px-3 py-2 text-xs leading-[1.65]"
          style={{
            background: 'var(--color-accent-dim)',
            color: 'var(--color-accent)',
            borderRadius: 'var(--radius-md)',
          }}
          role="status"
        >
          Withdrawal simulated. In Fedi, funds would move to the requester&apos;s wallet once the
          threshold is met.
        </p>
      )}
    </article>
  );
}
