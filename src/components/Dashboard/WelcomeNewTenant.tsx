import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface WelcomeStep {
  title: string;
  description: string;
  link: string;
  completed: boolean;
}

interface WelcomeNewTenantProps {
  onDismiss?: () => void;
}

export const WelcomeNewTenant = ({ onDismiss }: WelcomeNewTenantProps) => {
  const { tenant } = useAuth();

  const steps: WelcomeStep[] = [
    {
      title: "Créer vos bassins",
      description: "Commencez par définir vos bassins de production",
      link: "/bassins",
      completed: false,
    },
    {
      title: "Lancer une campagne",
      description: "Définissez votre première campagne de production",
      link: "/campagne",
      completed: false,
    },
    {
      title: "Configurer les équipes",
      description: "Ajoutez vos employés et créez vos équipes",
      link: "/equipes",
      completed: false,
    },
    {
      title: "Paramétrer la comptabilité",
      description: "Configurez votre plan comptable et types de dépenses",
      link: "/admin/chart-of-accounts",
      completed: false,
    },
  ];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">
                Bienvenue sur G-Suite Sel, {tenant?.name}! 🎉
              </CardTitle>
              <CardDescription className="mt-1">
                Votre compte entreprise a été créé avec succès. Commencez par configurer votre application.
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">Étapes de configuration</h3>
          <div className="grid gap-3">
            {steps.map((step, index) => (
              <Link key={index} to={step.link}>
                <div className="group flex items-center gap-3 p-4 rounded-lg border border-border bg-background hover:bg-accent/5 hover:border-accent transition-all cursor-pointer">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted group-hover:bg-accent/10 transition-colors">
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm group-hover:text-accent transition-colors">
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Vous pourrez toujours accéder à ces étapes plus tard
          </p>
          {onDismiss && (
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Masquer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
