'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ILnurlErrorBoundaryProps {
  children: ReactNode;
  title?: string;
}

interface ILnurlErrorBoundaryState {
  error: Error | null;
}

/** Catches render errors in LNURL demo sections so one failure does not crash the page. */
export class LnurlErrorBoundary extends Component<
  ILnurlErrorBoundaryProps,
  ILnurlErrorBoundaryState
> {
  state: ILnurlErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ILnurlErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[LnurlErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-error, #ef4444)',
          }}
          role="alert"
        >
          <p className="font-semibold">{this.props.title ?? 'LNURL section failed'}</p>
          <p className="mt-1 text-xs opacity-90">{this.state.error.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
