import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider.jsx";
import { ErrorBoundary } from "./ErrorBoundary.jsx";
import App from "./App.jsx";
import "@/styles/globals.css";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <ThemeProvider>
          <App />
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
