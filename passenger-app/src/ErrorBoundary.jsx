import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "var(--rs-surface)",
        color: "var(--rs-text-primary)"
      }}>
        <section className="rs-card" style={{ width: "100%", maxWidth: 420, padding: 24 }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>
            Something went wrong
          </h1>
          <p style={{ margin: "0 0 16px", color: "var(--rs-text-secondary)", lineHeight: 1.5 }}>
            RailSense could not render this screen. Refresh once, or go back to the complaint form.
          </p>
          <pre style={{
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            background: "var(--rs-surface-2)",
            border: "1px solid var(--rs-border)",
            borderRadius: 12,
            padding: 12,
            fontSize: 12,
            color: "var(--rs-text-secondary)"
          }}>
            {this.state.error?.message || "Unknown render error"}
          </pre>
          <button
            className="rs-btn-primary"
            onClick={() => {
              this.setState({ error: null });
              window.location.href = "/app/index.html#/compose";
            }}
            style={{ width: "100%", marginTop: 16 }}
          >
            Back to complaint form
          </button>
        </section>
      </main>
    );
  }
}
