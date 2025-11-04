import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Composant qui détecte les mises à jour PWA et invite l'utilisateur à recharger
 */
export const PWAUpdatePrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      const waiting = registration.waiting;
      if (waiting) {
        setWaitingWorker(waiting);
        setShowPrompt(true);
        
        toast({
          title: "Mise à jour disponible",
          description: "Une nouvelle version de l'application est disponible.",
          duration: 8000,
        });
      }
    };

    // Vérifier les mises à jour toutes les heures
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      } catch (error) {
        console.error('[PWA] Erreur lors de la vérification des mises à jour:', error);
      }
    };

    // Vérification initiale
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        handleUpdate(registration);
        
        // Écouter les mises à jour
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                handleUpdate(registration);
              }
            });
          }
        });
      }
    });

    // Vérifier les mises à jour régulièrement
    const interval = setInterval(checkForUpdates, 60 * 60 * 1000); // toutes les heures

    return () => clearInterval(interval);
  }, [toast]);

  const handleUpdate = () => {
    if (waitingWorker) {
      // Envoyer un message au service worker pour qu'il prenne le contrôle
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Recharger la page après que le nouveau SW soit actif
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="p-4 shadow-xl border-2 border-primary">
        <div className="flex items-start gap-3">
          <RefreshCw className="h-5 w-5 text-primary mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Mise à jour disponible</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Une nouvelle version est prête. Rechargez pour l'activer.
            </p>
            <div className="flex gap-2">
              <Button 
                onClick={handleUpdate} 
                size="sm"
                className="bg-gradient-to-r from-primary to-accent"
              >
                Mettre à jour
              </Button>
              <Button 
                onClick={handleDismiss} 
                size="sm" 
                variant="outline"
              >
                Plus tard
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
