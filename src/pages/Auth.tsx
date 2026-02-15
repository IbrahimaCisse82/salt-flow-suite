import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { logger } from "@/utils/logger";
import { loginFormSchema, signupFormSchema, emailSchema } from "@/utils/validation";
import { Capacitor } from '@capacitor/core';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import saltLogo from "@/assets/salt-logo.png";
import saltMarshesBg from "@/assets/salt-marshes-bg.jpg";
import { ImageWithLoading } from "@/components/ImageWithLoading";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // États pour la connexion
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // États pour l'inscription
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [signupTenantName, setSignupTenantName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupPasswordConfirm, setShowSignupPasswordConfirm] = useState(false);

  // États pour la réinitialisation du mot de passe
  const [resetEmail, setResetEmail] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté (une seule fois au montage)
  useEffect(() => {
    let isMounted = true;
    
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && isMounted) {
        navigate("/", { replace: true });
      }
    };
    
    checkUser();
    
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validation
      const validated = loginFormSchema.parse({
        email: loginEmail,
        password: loginPassword,
      });
      
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Email ou mot de passe incorrect");
        }
        throw error;
      }

      if (data.session) {
        // Check if user or tenant is deactivated
        const { data: statusData } = await supabase.rpc('check_user_active', { p_user_id: data.session.user.id });
        
        if (statusData && statusData.length > 0) {
          const status = statusData[0];
          if (!status.user_active) {
            await supabase.auth.signOut();
            throw new Error("Votre compte a été désactivé. Contactez votre administrateur.");
          }
          if (!status.tenant_active) {
            await supabase.auth.signOut();
            throw new Error(`L'entreprise "${status.tenant_name}" a été désactivée. Contactez l'administrateur.`);
          }
        }

        toast({
          title: "Connexion réussie",
          description: "Bienvenue !",
        });
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 100);
      }
    } catch (error: any) {
      logger.error("Login error:", error);
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
      // Vérifier que les mots de passe correspondent
      if (signupPassword !== signupPasswordConfirm) {
        toast({
          title: "Erreur",
          description: "Les mots de passe ne correspondent pas",
          variant: "destructive",
        });
        return;
      }
      
      // Validation with sanitization
      const validated = signupFormSchema.parse({
        email: signupEmail,
        password: signupPassword,
        fullName: signupFullName,
        tenantName: signupTenantName,
        acceptTerms: acceptTerms,
      });
      
      setLoading(true);

      // 1) Créer l'utilisateur via une Edge Function (pas d'email requis)
      const { data: createData, error: createErr } = await supabase.functions.invoke('create-user', {
        body: {
          email: validated.email,
          password: validated.password,
          full_name: validated.fullName,
          role: 'gerant',
        }
      });

      if (createErr) {
        // Extract the actual error message from the Edge Function response
        const errorMessage = createData?.error || createErr.message || "Impossible de créer le compte";
        throw new Error(errorMessage);
      }
      if (createData?.error) {
        throw new Error(createData.error);
      }
      if (!createData?.user?.id) throw new Error("Création utilisateur échouée");

      // 2) Se connecter pour obtenir une session (requis par RLS)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });
      if (signInError) throw signInError;
      if (!signInData.session) throw new Error("Impossible d'ouvrir une session");

      // 3) Créer le tenant
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

      const baseSubdomain = slugify(validated.tenantName);
      let subdomain = baseSubdomain || `tenant-${genSuffix()}`;

      // Try inserting tenant, handle duplicate subdomain by retrying with a unique suffix
      let tenantError: any | null = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const { error } = await supabase
          .from('tenants')
          .insert({
            id: tenantId,
            name: validated.tenantName,
            subdomain,
            contact_email: validated.email,
          });

        if (!error) {
          tenantError = null;
          break;
        }

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

      // 4) Lier le profil utilisateur au tenant (role already assigned by handle_new_user trigger)
      const user = signInData.session.user;
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ tenant_id: tenantId, full_name: validated.fullName, email: validated.email })
        .eq('id', user.id);

      if (profileUpdateError) throw profileUpdateError;

      toast({
        title: "Inscription réussie",
        description: "Votre entreprise et votre compte ont été créés",
      });
      // Attendre un court instant pour laisser l'AuthContext se mettre à jour
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    } catch (error: any) {
      logger.error("Signup error:", error);
      toast({
        title: "Erreur d'inscription",
        description: error.message || "Impossible de créer le compte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(resetEmail);
      
      setResetLoading(true);
      
      // Définir l'URL de redirection selon la plateforme
      const redirectUrl = Capacitor.isNativePlatform()
        ? 'app.lovable.a879894c887f41e89be4ab73e08c3d84://auth'
        : `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;

      toast({
        title: "Email envoyé",
        description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe",
      });
      
      setResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      logger.error("Password reset error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer l'email de réinitialisation",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${saltMarshesBg})` }}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center p-3">
              <ImageWithLoading 
                src={saltLogo} 
                alt="G-Suite Sel Logo" 
                className="h-full w-full object-contain"
              />
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
                    maxLength={255}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      maxLength={128}
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      disabled={loading}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
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
                
                <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="w-full" type="button">
                      Mot de passe oublié ?
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                      <DialogDescription>
                        Entrez votre adresse email pour recevoir un lien de réinitialisation.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="votre@email.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          maxLength={255}
                          required
                          disabled={resetLoading}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={resetLoading}
                      >
                        {resetLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Envoi...
                          </>
                        ) : (
                          "Envoyer le lien"
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
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
                    maxLength={100}
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
                    maxLength={200}
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
                    maxLength={255}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      maxLength={128}
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      disabled={loading}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Au moins 8 caractères (1 majuscule, 1 minuscule, 1 chiffre)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password-confirm">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="signup-password-confirm"
                      type={showSignupPasswordConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupPasswordConfirm}
                      onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                      maxLength={128}
                      required
                      disabled={loading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowSignupPasswordConfirm(!showSignupPasswordConfirm)}
                      disabled={loading}
                    >
                      {showSignupPasswordConfirm ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="accept-terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                    required
                    disabled={loading}
                    className="mt-1"
                  />
                  <Label htmlFor="accept-terms" className="text-sm leading-relaxed cursor-pointer">
                    J'ai lu et j'accepte les{" "}
                    <Link to="/cgu" target="_blank" className="text-primary hover:underline font-medium">
                      Conditions Générales d'Utilisation
                    </Link>
                  </Label>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-accent"
                  disabled={loading || !acceptTerms}
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
