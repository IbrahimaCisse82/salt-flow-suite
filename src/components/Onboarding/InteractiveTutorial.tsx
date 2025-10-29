import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TutorialStep {
  title: string;
  description: string;
  target?: string;
  position: "top" | "bottom" | "left" | "right";
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Bienvenue sur G-Suite Sel ! 👋",
    description: "Découvrez rapidement les fonctionnalités principales de votre application de gestion saline.",
    position: "bottom"
  },
  {
    title: "Dashboard principal",
    description: "Consultez vos statistiques en temps réel : production, bassins actifs, stock disponible.",
    position: "bottom"
  },
  {
    title: "Menu de navigation",
    description: "Accédez à tous les modules : Production, Commercial, Comptabilité, Équipes, etc.",
    target: ".sidebar",
    position: "right"
  },
  {
    title: "Gestion des bassins",
    description: "Suivez l'état de vos bassins et planifiez vos récoltes.",
    position: "bottom"
  },
  {
    title: "Module Commercial",
    description: "Gérez vos ventes, factures et relances clients automatiques.",
    position: "bottom"
  },
  {
    title: "Comptabilité intégrée",
    description: "Enregistrez vos transactions avec écritures comptables automatiques SYSCOHADA.",
    position: "bottom"
  }
];

export const InteractiveTutorial = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { profile } = useAuth();

  useEffect(() => {
    // Afficher le tutoriel uniquement pour les nouveaux utilisateurs
    const hasSeenTutorial = localStorage.getItem(`tutorial_seen_${profile?.id}`);
    if (!hasSeenTutorial && profile?.id) {
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, [profile?.id]);

  const handleClose = () => {
    setIsOpen(false);
    if (profile?.id) {
      localStorage.setItem(`tutorial_seen_${profile.id}`, "true");
    }
  };

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[100] animate-fade-in" onClick={handleClose} />
      
      {/* Tutorial Card */}
      <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[101] w-[90vw] max-w-md animate-scale-in shadow-elevated">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="flex gap-1">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" size="sm" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </Button>
              )}
              <Button size="sm" onClick={handleNext}>
                {currentStep === tutorialSteps.length - 1 ? "Terminer" : "Suivant"}
                {currentStep < tutorialSteps.length - 1 && (
                  <ChevronRight className="h-4 w-4 ml-1" />
                )}
              </Button>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Passer le tutoriel
          </button>
        </CardContent>
      </Card>
    </>
  );
};
