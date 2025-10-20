import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Download, Check, ArrowLeft } from "lucide-react";
import saltLogo from "@/assets/salt-logo.png";

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Écouter l'événement d'installation
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Écouter si l'app a été installée
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex flex-col items-center justify-center p-4">
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center p-4">
              <img src={saltLogo} alt="G-Suite Sel Logo" className="h-full w-full object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl">Installer G-Suite Sel</CardTitle>
          <CardDescription>
            Installez l'application sur votre appareil pour un accès rapide et une expérience optimale
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Application installée !</h3>
                <p className="text-sm text-muted-foreground">
                  G-Suite Sel est maintenant disponible sur votre écran d'accueil
                </p>
              </div>
              <Button onClick={() => navigate("/")} className="w-full">
                Ouvrir l'application
              </Button>
            </div>
          ) : isInstallable ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Download className="h-8 w-8 text-primary" />
                </div>
              </div>
              <Button onClick={handleInstallClick} className="w-full" size="lg">
                <Download className="mr-2 h-5 w-5" />
                Installer maintenant
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-accent" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Comment installer :</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <p>
                      <strong>Sur iPhone/iPad :</strong> Appuyez sur le bouton Partager
                      <span className="inline-block mx-1">
                        <svg className="h-4 w-4 inline" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/>
                        </svg>
                      </span>
                      puis "Sur l'écran d'accueil"
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <p>
                      <strong>Sur Android :</strong> Ouvrez le menu du navigateur (⋮) puis "Installer l'application" ou "Ajouter à l'écran d'accueil"
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                Continuer sur le web
              </Button>
            </div>
          )}

          <div className="pt-4 border-t space-y-3">
            <h4 className="font-semibold text-sm">Avantages de l'installation :</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Accès rapide depuis votre écran d'accueil</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Fonctionne hors ligne pour consulter vos données</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Chargement plus rapide et expérience fluide</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Interface plein écran sans barre de navigation</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
