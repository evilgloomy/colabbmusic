import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./i18n";
import "./index.css";
import { hasConsent, initAnalytics } from "./lib/analytics";

// Re-initialize analytics for returning visitors who previously accepted.
if (hasConsent()) {
  initAnalytics();
}

createRoot(document.getElementById("root")!).render(<App />);
