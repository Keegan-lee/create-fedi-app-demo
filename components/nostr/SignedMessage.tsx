'use client';

import { useState } from 'react';
import { useIdentityFlow } from '../../hooks/useIdentityFlow';

interface ISignedMessageProps {
  defaultMessage?: string;
}

export function SignedMessage({ defaultMessage = 'Hello from create-fedi-app!' }: ISignedMessageProps) {
  const { isConnected, isConnecting, signTextNote, lastSignedEvent, signError } = useIdentityFlow();
  const [message, setMessage] = useState(defaultMessage);
  const [isSigning, setIsSigning] = useState(false);

  async function handleSign() {
    if (!message.trim()) return;
    setIsSigning(true);
    try {
      await signTextNote(message.trim());
    } finally {
      setIsSigning(false);
    }
  }

  if (!isConnected) {
    return (
      <p className="text-sm text-[var(--color-text-subtle)]">
        Connect your identity above to sign a message.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-[75ch] text-sm leading-[1.65] text-[var(--color-text-muted)]">
        Signing creates a cryptographic proof that you hold the private key for your pubkey, without
        ever revealing the key itself. Anyone can verify the signature against your public identity.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
          Message to sign
        </span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
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
        onClick={handleSign}
        disabled={!message.trim() || isSigning || isConnecting}
        className="self-start rounded-lg px-4 py-2 text-sm font-semibold transition-opacity duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:opacity-80 active:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          background: 'var(--color-accent)',
          color: 'var(--color-primary-foreground)',
          borderRadius: 'var(--radius-md)',
        }}
        aria-label="Sign message with Nostr key"
      >
        {isSigning ? 'Signing…' : 'Sign'}
      </button>

      {signError && (
        <p className="text-xs text-[var(--color-error,#ef4444)]" role="alert">
          {signError.message}
        </p>
      )}

      {lastSignedEvent && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-subtle)]">
            Signed Nostr event
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
          <p className="text-xs leading-[1.65] text-[var(--color-text-subtle)]">
            The <code className="font-mono">sig</code> field is a Schnorr signature over the event
            hash. The <code className="font-mono">pubkey</code> identifies who signed it.
          </p>
        </div>
      )}
    </div>
  );
}
