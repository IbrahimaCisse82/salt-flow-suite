import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PushNotificationProvider } from "@/components/PushNotificationProvider";
import { InteractiveTutorial } from "@/components/Onboarding/InteractiveTutorial";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ThemeProvider } from "next-themes";
import { BrowserRouter } from "react-router-dom";
import { errorTracker } from "@/utils/errorTracking";
import { analytics } from "@/utils/analytics";

// Initialize monitoring in production
// STEP 1: Add VITE_SENTRY_DSN and VITE_GA4_MEASUREMENT_ID to .env.production
// STEP 2: Uncomment the 2 lines below
// errorTracker.init(import.meta.env.VITE_SENTRY_DSN);
// analytics.init(import.meta.env.VITE_GA4_MEASUREMENT_ID);

// Component wrapper pour les hooks
const AppWithFeatures = () => {
  useKeyboardShortcuts();
  
  return (
    <>
      <App />
      <InteractiveTutorial />
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <BrowserRouter>
        <ErrorBoundary>
          <PushNotificationProvider>
            <AppWithFeatures />
          </PushNotificationProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
