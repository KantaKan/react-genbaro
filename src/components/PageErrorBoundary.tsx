import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Page crashed", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="mx-auto max-w-md py-16 text-center">
        <p className="text-base font-semibold">This page hit a snag</p>
        <p className="mt-1 text-sm opacity-70">Nothing you did. The rest of Baro still works, so you can pick another page or try this one again.</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-full border px-4 py-2 text-sm font-semibold">
          Reload this page
        </button>
      </div>
    );
  }
}

/** Keeps one broken page from blanking the whole app; resets when you navigate. */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <Boundary key={pathname}>{children}</Boundary>;
}
