import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield } from "lucide-react";
import { z } from "zod";
import saltLogo from "@/assets/salt-logo.png";
import saltMarshesBg from "@/assets/salt-marshes-bg.jpg";

const emailSchema = z.string().email("Email invalide");
const passwordSchema = z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères");

export default function AdminSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Vérifier si un admin existe déjà
  useEffect(() => {
    const checkExistingAdmin = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
          .limit(1);

        if (error) {
          console.error("Error checking admin:", error);
          toast({
            title: "Erreur",
            description: "Impossible de vérifier les administrateurs existants",
            variant: "destructive",
          });
          return;
        }

        if (data && data.length > 0) {
          toast({
            title: "Accès refusé",
            description: "Un administrateur existe déjà",
          });
          navigate("/auth");
        }
      } catch (error) {
        console.error("Error checking admin:", error);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkExistingAdmin();
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validation
      emailSchema.parse(email);
      passwordSchema.parse(password);
      
      if (!fullName.trim()) {
        throw new Error("Le nom complet est obligatoire");
      }
      
      if (password !== confirmPassword) {
        throw new Error("Les mots de passe ne correspondent pas");
      }
      
      setLoading(true);

      // Créer l'utilisateur administrateur
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: {
            full_name: fullName.trim(),
            role: 'admin',
            tenant_id: null
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
          title: "Administrateur créé",
          description: "Compte administrateur créé avec succès",
        });
        navigate("/admin");
      } else {
        toast({
          title: "Vérification requise",
          description: "Veuillez vérifier votre email pour activer votre compte",
        });
      }
    } catch (error: any) {
      console.error("Admin setup error:", error);
      toast({
        title: "Erreur de création",
        description: error.message || "Impossible de créer le compte administrateur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${saltMarshesBg})` }}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center p-3">
              <Shield className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Configuration Administrateur</CardTitle>
          <CardDescription>
            Créez le premier compte administrateur du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullname">Nom complet</Label>
              <Input
                id="fullname"
                type="text"
                placeholder="Administrateur Système"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Au moins 8 caractères
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Création du compte...
                </>
              ) : (
                "Créer le compte administrateur"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      <footer className="absolute bottom-4 left-0 right-0 text-center z-10">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Grow Hub Sarl. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
