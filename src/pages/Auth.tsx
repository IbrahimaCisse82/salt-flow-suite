import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import saltLogo from "@/assets/salt-logo.png";
import saltMarshesBg from "@/assets/salt-marshes-bg.jpg";
import { ImageWithLoading } from "@/components/ImageWithLoading";
import { LoginForm } from "@/components/Auth/LoginForm";
import { SignupForm } from "@/components/Auth/SignupForm";

const Auth = () => {
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    let isMounted = true;
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && isMounted) {
        navigate("/", { replace: true });
      }
    };
    checkUser();
    return () => { isMounted = false; };
  }, [navigate]);

  const handleAuthSuccess = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${saltMarshesBg})` }}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center p-3">
              <ImageWithLoading src={saltLogo} alt="G-Suite Sel Logo" className="h-full w-full object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl">G-Suite Sel</CardTitle>
          <CardDescription>
            Système de gestion intégré pour l'exploitation saline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSuccess={handleAuthSuccess} />
            </TabsContent>
            <TabsContent value="signup">
              <SignupForm onSuccess={handleAuthSuccess} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <footer className="absolute bottom-4 left-0 right-0 text-center z-10">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Grow Hub Sarl. Tous droits réservés.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          <a href="mailto:support@g-suiteapp.com" className="hover:text-primary transition-colors">
            support@g-suiteapp.com
          </a>
          {" · "}
          <Link to="/cgu" className="hover:text-primary transition-colors">
            CGU
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default Auth;
