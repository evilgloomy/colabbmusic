import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./i18n";
import "./index.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import { hasConsent, initAnalytics } from "./lib/analytics";

// Re-initialize analytics for returning visitors who previously accepted.
if (hasConsent()) {
  initAnalytics();
}

createRoot(document.getElementById("root")!).render(<App />);
