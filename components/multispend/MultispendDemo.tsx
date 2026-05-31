'use client';

import { useState } from 'react';
import { useIdentity } from '../../lib/nostr';
import { IdentityBadge } from '../nostr/IdentityBadge';
import { useMultispendDemo } from '../../hooks/useMultispendDemo';
import { ProposalList } from './ProposalList';

export function MultispendDemo() {
  const { pubkey, getPublicKey, isConnecting } = useIdentity();
  const [localPubkey, setLocalPubkey] = useState<string | null>(null);
  const [amountSats, setAmountSats] = useState('25000');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    proposals,
    openProposals,
    lastSignedEvent,
    executingId,
    createProposal,
    recordVote,
    simulateExecution,
  } = useMultispendDemo();

  const activePubkey = pubkey ?? localPubkey;

  async function ensureConnected(): Promise<string | null> {
    if (activePubkey) return activePubkey;
    const pk = await getPublicKey();
    if (pk) setLocalPubkey(pk);
    return pk;
  }

  async function handleCreateProposal(event: React.FormEvent) {
    event.preventDefault();
    setCreateError(null);

    const proposerPubkey = await ensureConnected();
    if (!proposerPubkey) {
      setCreateError('Connect your Nostr identity to create a proposal.');
      return;
    }

    const parsedAmount = Number.parseInt(amountSats, 10);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setCreateError('Enter a valid amount in sats.');
      return;
    }

    if (!description.trim()) {
      setCreateError('Add a description for the spending request.');
      return;
    }

    createProposal({
      amountSats: parsedAmount,
      description: description.trim(),
      proposerPubkey,
    });

    setDescription('');
    setAmountSats('25000');
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="max-w-[75ch] space-y-1.5">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
            Your identity
          </h2>
          <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
            Connect with Nostr to vote on proposals. Your pubkey becomes one of the required signers
            when you create a request.
          </p>
        </div>
        <IdentityBadge />
      </section>

      <section className="space-y-4">
        <div className="max-w-[75ch] space-y-1.5">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
            Create proposal
          </h2>
          <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
            Mock a withdrawal request from a shared Multispend wallet. Other voters are simulated.
            Only your vote uses a real Nostr signature.
          </p>
        </div>

        <form
          onSubmit={handleCreateProposal}
          className="space-y-4 rounded-xl p-4"
          style={{
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
              Amount (sats)
            </span>
            <input
              type="number"
              min={1}
              step={1}
              value={amountSats}
              onChange={(e) => setAmountSats(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--color-surface-2, var(--color-bg))',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this withdrawal for?"
              className="w-full resize-none rounded-lg px-3 py-2 text-sm"
              style={{
                background: 'var(--color-surface-2, var(--color-bg))',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </label>

          <p className="text-xs leading-[1.65] text-[var(--color-text-subtle)]">
            New proposals use a 2-of-3 threshold with you plus two mock voters (Alice and Bob).
          </p>

          {createError && (
            <p className="text-xs text-[var(--color-error,#ef4444)]" role="alert">
              {createError}
            </p>
          )}

          <button
            type="submit"
            disabled={isConnecting}
            className="rounded-lg px-4 py-2 text-sm font-semibold transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-80 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-primary-foreground)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            Create proposal
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="max-w-[75ch] space-y-1.5">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
            Open proposals
          </h2>
          <p className="text-sm leading-[1.65] text-[var(--color-text-muted)]">
            Approve or reject pending requests. When enough voters agree, simulate the withdrawal
            execution.
          </p>
        </div>
        <ProposalList
          proposals={openProposals}
          currentPubkey={activePubkey}
          onVote={(proposalId, vote, signedEvent) =>
            recordVote(proposalId, activePubkey!, vote, signedEvent)
          }
          onExecute={simulateExecution}
          executingId={executingId}
        />
      </section>

      {proposals.some((p) => p.status === 'executed') && (
        <section className="space-y-4">
          <div className="max-w-[75ch] space-y-1.5">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
              Executed
            </h2>
          </div>
          <ProposalList
            proposals={proposals.filter((p) => p.status === 'executed')}
            currentPubkey={activePubkey}
          />
        </section>
      )}

      {lastSignedEvent && (
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
            Last signed vote event
          </p>
          <pre
            className="overflow-auto rounded-lg p-3 font-mono text-xs leading-relaxed"
            style={{
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {JSON.stringify(lastSignedEvent, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
