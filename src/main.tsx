import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { AuthProviderMock } from "@/contexts/AuthContextFictif";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PushNotificationProvider } from "@/components/PushNotificationProvider";
import { InteractiveTutorial } from "@/components/Onboarding/InteractiveTutorial";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ThemeProvider } from "next-themes";
import { BrowserRouter } from "react-router-dom";

// ✅ Wrapper existant
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

// ✅ ICI SEULEMENT on ajoute AuthProviderMock
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <BrowserRouter>
        <ErrorBoundary>
          <PushNotificationProvider>

            {/* ✅ PROVIDER FICTIF ICI */}
            <AuthProviderMock>
              <AppWithFeatures />
            </AuthProviderMock>

          </PushNotificationProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
