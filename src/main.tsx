import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PushNotificationProvider } from "@/components/PushNotificationProvider";
import { InteractiveTutorial } from "@/components/Onboarding/InteractiveTutorial";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ThemeProvider } from "next-themes";
import { BrowserRouter } from "react-router-dom";

const AppWithFeatures = () => {
  useKeyboardShortcuts();

  return (
    <>
      <App />
      <InteractiveTutorial />
      <PWAUpdatePrompt />
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
