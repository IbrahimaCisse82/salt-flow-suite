import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const getInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Pour installer sur iPhone/iPad :</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Appuyez sur le bouton de partage <span className="font-bold">⎙</span></li>
            <li>Sélectionnez "Sur l'écran d'accueil"</li>
            <li>Appuyez sur "Ajouter"</li>
          </ol>
        </div>
      );
    }

    if (isAndroid) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Pour installer sur Android :</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Appuyez sur le menu (⋮) dans votre navigateur</li>
            <li>Sélectionnez "Installer l'application" ou "Ajouter à l'écran d'accueil"</li>
            <li>Confirmez l'installation</li>
          </ol>
        </div>
      );
    }

    return (
      <p className="text-sm text-muted-foreground">
        Cette application peut être installée sur votre appareil mobile pour une meilleure expérience.
      </p>
    );
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-primary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
              <Check className="h-8 w-8 text-success" />
            </div>
            <CardTitle>Application installée !</CardTitle>
            <CardDescription>
              G-Suite Sel est maintenant disponible sur votre écran d'accueil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Ouvrir l'application
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-primary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Installer G-Suite Sel</CardTitle>
          <CardDescription>
            Installez l'application sur votre appareil pour un accès rapide et une meilleure expérience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Avantages de l'installation :</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>Accès rapide depuis l'écran d'accueil</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>Fonctionne hors ligne</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>Expérience similaire à une application native</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>Chargement plus rapide</span>
              </li>
            </ul>
          </div>

          {isInstallable ? (
            <Button onClick={handleInstall} className="w-full" size="lg">
              <Download className="mr-2 h-5 w-5" />
              Installer maintenant
            </Button>
          ) : (
            <div className="space-y-4">
              {getInstallInstructions()}
            </div>
          )}

          <Button variant="outline" onClick={() => navigate('/')} className="w-full">
            Continuer sans installer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
