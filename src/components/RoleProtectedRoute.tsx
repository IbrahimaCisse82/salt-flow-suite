import { useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { hasAccessToPage, UserRole } from "@/utils/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export const RoleProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const userRole = (profile?.role as UserRole) || null;
  const currentPath = location.pathname;

  // Afficher le loader pendant la vérification
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si pas authentifié, rediriger vers /auth
  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  // Redirection automatique pour admin depuis la racine
  if (userRole === 'admin' && currentPath === '/') {
    return <Navigate to="/admin" replace />;
  }

  // Redirection automatique pour non-admin depuis les pages admin
  if (userRole !== 'admin' && currentPath.startsWith('/admin')) {
    return <Navigate to="/" replace />;
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
            <Button onClick={() => navigate(-1)}>
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
