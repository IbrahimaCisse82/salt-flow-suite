import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PushNotificationProvider } from "@/components/PushNotificationProvider";
import { InteractiveTutorial } from "@/components/Onboarding/InteractiveTutorial";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ThemeProvider } from "next-themes";

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
      <ErrorBoundary>
        <PushNotificationProvider>
          <AppWithFeatures />
        </PushNotificationProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>
);
