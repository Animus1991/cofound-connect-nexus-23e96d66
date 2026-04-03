import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Root-level error boundary that catches fatal errors before the router mounts.
 * Uses plain HTML/CSS since it can't depend on any providers.
 */
export default class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("RootErrorBoundary caught:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: "#fafafa",
          color: "#1a1a1a",
        }}>
          <div style={{ maxWidth: "400px", textAlign: "center" }}>
            <div style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 1.5rem",
              borderRadius: "16px",
              backgroundColor: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
            }}>
              ⚠️
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: "0 0 0.5rem" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#666", margin: "0 0 1rem" }}>
              An unexpected error occurred. Please try reloading the page.
            </p>
            {this.state.error && (
              <p style={{
                fontSize: "0.75rem",
                color: "#999",
                fontFamily: "monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }} title={this.state.error.message}>
                {this.state.error.message}
              </p>
            )}
            <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Reload page
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #e5e5e5",
                  backgroundColor: "white",
                  color: "#1a1a1a",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Go home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
