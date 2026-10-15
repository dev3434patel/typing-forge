import { Component, type ErrorInfo, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    /* Keep user text out of diagnostic logs. */
  }
  render() {
    if (this.state.failed)
      return (
        <main className="forge-main max-w-xl py-24">
          <p className="eyebrow">Something interrupted this view</p>
          <h1 className="text-3xl font-semibold my-4">
            Let’s get you back to practice.
          </h1>
          <p className="text-muted-foreground mb-6">
            Your saved history is retained on this device. Reload to recover the
            application.
          </p>
          <button className="forge-button" onClick={() => location.reload()}>
            Reload Typing Forge
          </button>
        </main>
      );
    return this.props.children;
  }
}
