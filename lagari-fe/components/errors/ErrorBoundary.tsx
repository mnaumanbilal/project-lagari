"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Short label for logs and fallback UI */
  scope?: string;
  fallback?: ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[${this.props.scope ?? "app"}] Uncaught render error:`,
      error,
      info.componentStack,
    );
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          className="mx-auto max-w-lg rounded-sm border border-lagari-danger/40 bg-lagari-danger/10 p-6 text-center"
        >
          <p className="font-medium text-lagari-primary">Something went wrong</p>
          <p className="mt-2 text-sm text-lagari-muted">
            This section could not be displayed. The rest of the site is still
            available — try again or refresh the page.
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="admin-btn mt-4 rounded-sm border border-lagari-border px-4 py-2 text-sm text-lagari-primary hover:border-lagari-brass"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
