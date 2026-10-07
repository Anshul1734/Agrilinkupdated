import React from "react";
import { TriangleAlert } from "lucide-react";

interface State {
  failed: boolean;
}

/** Last line of defence: a rendering bug shows a recoverable message instead of a blank page. */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Unhandled UI error", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-chili-wash text-chili"><TriangleAlert className="h-9 w-9" strokeWidth={1.6} /></div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 max-w-md text-ink-soft">An unexpected error stopped this page from loading. Your basket is safe and nothing was lost.</p>
        <div className="mt-6 flex gap-3">
          <button className="h-10 rounded-md bg-field px-5 text-sm font-semibold text-white hover:bg-field-deep" onClick={() => window.location.reload()}>Reload page</button>
          <a className="inline-flex h-10 items-center rounded-md border border-input bg-paper-raised px-5 text-sm font-semibold hover:bg-paper-sunk" href="/">Go to home</a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
