import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert } from "lucide-react";
import { hasAccessToPage, UserRole } from "@/utils/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { logger } from "@/utils/logger";
import { useAuth } from "@/contexts/AuthContext";

export const RoleProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading: authLoading } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Utiliser le rôle du profil depuis AuthContext
  const userRole = (profile?.role as UserRole) || null;
  
  // Obtenir le chemin actuel sans utiliser useLocation()
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';

  useEffect(() => {
    if (!authLoading) {
      setCheckingAuth(false);
    }
  }, [authLoading]);

  // Afficher le loader pendant la vérification
  if (authLoading || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si pas authentifié, rediriger vers /auth
  useEffect(() => {
    if (!profile && !authLoading) {
      window.location.href = '/auth';
    }
  }, [profile, authLoading]);

  // Redirections automatiques selon le rôle
  useEffect(() => {
    if (userRole === 'admin' && currentPath === '/') {
      window.location.href = '/admin';
    }
    if (userRole !== 'admin' && currentPath.startsWith('/admin')) {
      window.location.href = '/';
    }
  }, [userRole, currentPath]);

  // Pendant la redirection, afficher un loader
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Vérifier si l'utilisateur a accès à cette page
  const hasAccess = hasAccessToPage(userRole, currentPath);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">Accès refusé</CardTitle>
            <CardDescription>
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Votre rôle actuel : <span className="font-semibold capitalize">{userRole}</span>
            </p>
            <Button onClick={() => window.history.back()}>
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
