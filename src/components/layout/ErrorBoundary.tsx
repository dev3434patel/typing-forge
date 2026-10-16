import { Component, type ErrorInfo, type ReactNode } from "react";
import "./app-recovery.css";
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
        <main className="app-recovery" id="main-content">
          <p className="app-recovery-label">Something interrupted this view</p>
          <h1>Let’s get you back to practice.</h1>
          <p>
            Your saved history is retained on this device. Reload to recover the
            application.
          </p>
          <button type="button" onClick={() => location.reload()}>
            Reload SparowType
          </button>
        </main>
      );
    return this.props.children;
  }
}
