import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import saltLogo from "@/assets/salt-logo.png";
import saltMarshesBg from "@/assets/salt-marshes-bg.jpg";

const emailSchema = z.string().email("Email invalide");
const passwordSchema = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères");

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // États pour la connexion
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // États pour l'inscription
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupTenantName, setSignupTenantName] = useState("");

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validation
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
      
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Email ou mot de passe incorrect");
        }
        throw error;
      }

      if (data.session) {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue !",
        });
        navigate("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Impossible de se connecter",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validation
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
      
      if (!signupFullName.trim()) {
        throw new Error("Le nom complet est obligatoire");
      }
      
      if (!signupTenantName.trim()) {
        throw new Error("Le nom de l'entreprise est obligatoire");
      }
      
      setLoading(true);

      // Créer d'abord le tenant sans SELECT pour éviter les problèmes RLS sur RETURNING
      const tenantId = crypto.randomUUID();

      const slugify = (str: string) =>
        str
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
          .slice(0, 48);

      const genSuffix = () => {
        const bytes = new Uint8Array(3);
        crypto.getRandomValues(bytes);
        return Array.from(bytes)
          .map((b) => (b % 36).toString(36))
          .join('');
      };

      const baseSubdomain = slugify(signupTenantName.trim());
      let subdomain = baseSubdomain || `tenant-${genSuffix()}`;

      // Try inserting tenant, handle duplicate subdomain by retrying with a unique suffix
      let tenantError: any | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const { error } = await supabase
          .from('tenants')
          .insert({
            id: tenantId,
            name: signupTenantName.trim(),
            subdomain,
            contact_email: signupEmail,
          });

        if (!error) {
          tenantError = null;
          break;
        }

        // If unique constraint on subdomain, retry once with random suffix
        if (
          attempt === 0 &&
          (error.code === '23505' || (error.message || '').includes('tenants_subdomain_key'))
        ) {
          subdomain = `${baseSubdomain}-${genSuffix()}`;
          tenantError = error;
          continue;
        }

        tenantError = error;
        break;
      }

      if (tenantError) throw tenantError;

      // Créer l'utilisateur avec les métadonnées (Gérant = propriétaire du compte)
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: signupFullName.trim(),
            tenant_id: tenantId,
            role: 'gerant'
          }
        }
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          throw new Error("Cet email est déjà utilisé");
        }
        throw error;
      }

      if (data.session) {
        toast({
          title: "Inscription réussie",
          description: "Votre compte a été créé avec succès",
        });
        navigate("/");
      } else {
        toast({
          title: "Vérification requise",
          description: "Veuillez vérifier votre email pour activer votre compte",
        });
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Impossible de créer le compte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${saltMarshesBg})` }}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center p-3">
              <img src={saltLogo} alt="G-Suite Sel Logo" className="h-full w-full object-contain" />
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
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nom complet</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Jean Dupont"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-tenant">Nom de l'entreprise</Label>
                  <Input
                    id="signup-tenant"
                    type="text"
                    placeholder="Salines du Sénégal"
                    value={signupTenantName}
                    onChange={(e) => setSignupTenantName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Au moins 6 caractères
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création du compte...
                    </>
                  ) : (
                    "Créer un compte"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <footer className="absolute bottom-4 left-0 right-0 text-center z-10">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Grow Hub Sarl. Tous droits réservés.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          <a href="mailto:contact@growhubsenegal.com" className="hover:text-primary transition-colors">
            contact@growhubsenegal.com
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Auth;
