import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { logger } from "@/utils/logger";
import { loginFormSchema } from "@/utils/validation";
import { rateLimiter, RATE_LIMITS } from "@/utils/rateLimit";
import { ResetPasswordDialog } from "./ResetPasswordDialog";

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limiting
    if (!rateLimiter.check('auth-login', RATE_LIMITS.AUTH)) {
      const resetIn = Math.ceil(rateLimiter.getResetTime('auth-login') / 1000);
      toast({
        title: "Trop de tentatives",
        description: `Réessayez dans ${resetIn} secondes`,
        variant: "destructive",
      });
      return;
    }

    try {
      const validated = loginFormSchema.parse({ email, password });
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
        toast({ title: "Connexion réussie", description: "Bienvenue !" });
        onSuccess();
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

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            {showPassword ? (
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
      <ResetPasswordDialog />
    </form>
  );
};
