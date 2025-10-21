import { ReactNode } from "react";
import { usePushNotificationListener } from "@/hooks/usePushNotificationListener";

interface PushNotificationProviderProps {
  children: ReactNode;
}

/**
 * Provider qui écoute les notifications et envoie automatiquement des push notifications
 */
export const PushNotificationProvider = ({ children }: PushNotificationProviderProps) => {
  usePushNotificationListener();
  return <>{children}</>;
};
