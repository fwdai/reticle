import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import { AppProvider } from "@/contexts/AppContext";
import { initTelemetry } from "@/lib/telemetry";

initTelemetry();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
