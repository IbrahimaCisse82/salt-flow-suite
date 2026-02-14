import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, MapPinOff } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    logger.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md animate-fade-in">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          <MapPinOff className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
        <p className="text-xl font-medium text-foreground mb-2">
          Page introuvable
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          La page <code className="px-1.5 py-0.5 rounded bg-muted text-xs">{location.pathname}</code> n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="gap-2 bg-gradient-to-r from-primary to-accent"
          >
            <Home className="h-4 w-4" />
            Tableau de bord
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
