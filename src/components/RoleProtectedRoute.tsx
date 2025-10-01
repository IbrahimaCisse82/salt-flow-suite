import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert } from "lucide-react";
import { hasAccessToPage, UserRole } from "@/utils/permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";

export const RoleProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    // Filet de sécurité: éviter un loader infini si auth traîne en iframe
    const timer = setTimeout(() => {
      if (!cancelled) {
        setIsAuthenticated(false);
        setLoading(false);
      }
    }, 4000);

    const checkAuthAndRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsAuthenticated(false);
          return;
        }

        setIsAuthenticated(true);

        // Récupérer le rôle de l'utilisateur (fallback sur user_metadata)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        const derivedRole = (profile?.role as UserRole) || (session.user.user_metadata?.role as UserRole) || null;
        setUserRole(derivedRole);
      } catch (e) {
        console.error('Auth check failed', e);
        setIsAuthenticated(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
          clearTimeout(timer);
        }
      }
    };

    checkAuthAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (!session) {
          setIsAuthenticated(false);
          setUserRole(null);
        } else {
          setIsAuthenticated(true);
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle();

          const derivedRole = (profile?.role as UserRole) || (session.user.user_metadata?.role as UserRole) || null;
          setUserRole(derivedRole);
        }
      } catch (e) {
        console.error('Auth state change error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => { cancelled = true; clearTimeout(timer); subscription.unsubscribe(); };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Redirections automatiques selon le rôle
  if (userRole === 'admin' && location.pathname === '/') {
    return <Navigate to="/admin" replace />;
  }
  if (userRole !== 'admin' && location.pathname.startsWith('/admin')) {
    return <Navigate to="/" replace />;
  }

  // Vérifier si l'utilisateur a accès à cette page
  const hasAccess = hasAccessToPage(userRole, location.pathname);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6">
            <Card className="max-w-2xl mx-auto mt-20">
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
          </main>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
