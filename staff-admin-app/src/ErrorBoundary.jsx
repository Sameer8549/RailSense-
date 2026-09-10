import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  componentDidCatch(error, info) {
    this.setState({ error, info });
    console.error("[ErrorBoundary] Caught:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          justifyContent: "center", background: "#0f172a", color: "#f1f5f9",
          fontFamily: "monospace", padding: "2rem", flexDirection: "column", gap: "1.5rem"
        }}>
          <div style={{ fontSize: "2rem" }}>💥 Runtime Error</div>
          <div style={{
            background: "#1e293b", border: "1px solid #ef4444", borderRadius: "0.5rem",
            padding: "1.5rem", maxWidth: "720px", width: "100%"
          }}>
            <div style={{ color: "#ef4444", fontWeight: "bold", marginBottom: "0.5rem" }}>
              {this.state.error?.message}
            </div>
            <pre style={{ fontSize: "0.7rem", color: "#94a3b8", overflowX: "auto", whiteSpace: "pre-wrap" }}>
              {this.state.error?.stack}
            </pre>
          </div>
          <button
            onClick={() => this.setState({ error: null, info: null })}
            style={{
              background: "#3b82f6", color: "white", border: "none",
              padding: "0.5rem 1.5rem", borderRadius: "0.375rem", cursor: "pointer"
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
