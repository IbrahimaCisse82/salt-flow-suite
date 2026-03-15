import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { logger } from "@/utils/logger";
import { signupFormSchema } from "@/utils/validation";

interface SignupFormProps {
  onSuccess: () => void;
}

export const SignupForm = ({ onSuccess }: SignupFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (password !== passwordConfirm) {
        toast({
          title: "Erreur",
          description: "Les mots de passe ne correspondent pas",
          variant: "destructive",
        });
        return;
      }

      const validated = signupFormSchema.parse({
        email,
        password,
        fullName,
        tenantName,
        acceptTerms,
      });

      setLoading(true);

      // 1) Create user via Edge Function
      const { data: createData, error: createErr } = await supabase.functions.invoke("create-user", {
        body: {
          email: validated.email,
          password: validated.password,
          full_name: validated.fullName,
          role: "gerant",
        },
      });

      if (createErr) {
        throw new Error(createData?.error || createErr.message || "Impossible de créer le compte");
      }
      if (createData?.error) throw new Error(createData.error);
      if (!createData?.user?.id) throw new Error("Création utilisateur échouée");

      // 2) Sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });
      if (signInError) throw signInError;
      if (!signInData.session) throw new Error("Impossible d'ouvrir une session");

      // 3) Create tenant
      const tenantId = crypto.randomUUID();

      const slugify = (str: string) =>
        str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 48);

      const genSuffix = () => {
        const bytes = new Uint8Array(3);
        crypto.getRandomValues(bytes);
        return Array.from(bytes).map((b) => (b % 36).toString(36)).join("");
      };

      const baseSubdomain = slugify(validated.tenantName);
      let subdomain = baseSubdomain || `tenant-${genSuffix()}`;

      let tenantError: any = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        const { error } = await supabase.from("tenants").insert({
          id: tenantId,
          name: validated.tenantName,
          subdomain,
          contact_email: validated.email,
        });

        if (!error) {
          tenantError = null;
          break;
        }

        if (attempt === 0 && (error.code === "23505" || (error.message || "").includes("tenants_subdomain_key"))) {
          subdomain = `${baseSubdomain}-${genSuffix()}`;
          tenantError = error;
          continue;
        }

        tenantError = error;
        break;
      }

      if (tenantError) throw tenantError;

      // 4) Link profile to tenant
      const user = signInData.session.user;
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ tenant_id: tenantId, full_name: validated.fullName, email: validated.email })
        .eq("id", user.id);

      if (profileUpdateError) throw profileUpdateError;

      toast({
        title: "Inscription réussie",
        description: "Votre entreprise et votre compte ont été créés",
      });
      onSuccess();
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

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Nom complet</Label>
        <Input id="signup-name" type="text" placeholder="Jean Dupont" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} required disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-tenant">Nom de l'entreprise</Label>
        <Input id="signup-tenant" type="text" placeholder="Salines du Sénégal" value={tenantName} onChange={(e) => setTenantName(e.target.value)} maxLength={200} required disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input id="signup-email" type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">Mot de passe</Label>
        <div className="relative">
          <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128} required disabled={loading} className="pr-10" />
          <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={loading}>
            {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Au moins 8 caractères (1 majuscule, 1 minuscule, 1 chiffre)</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password-confirm">Confirmer le mot de passe</Label>
        <div className="relative">
          <Input id="signup-password-confirm" type={showPasswordConfirm ? "text" : "password"} placeholder="••••••••" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} maxLength={128} required disabled={loading} className="pr-10" />
          <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPasswordConfirm(!showPasswordConfirm)} disabled={loading}>
            {showPasswordConfirm ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <Checkbox id="accept-terms" checked={acceptTerms} onCheckedChange={(checked) => setAcceptTerms(checked === true)} required disabled={loading} className="mt-1" />
        <Label htmlFor="accept-terms" className="text-sm leading-relaxed cursor-pointer">
          J'ai lu et j'accepte les{" "}
          <Link to="/cgu" target="_blank" className="text-primary hover:underline font-medium">
            Conditions Générales d'Utilisation
          </Link>
        </Label>
      </div>
      <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent" disabled={loading || !acceptTerms}>
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
  );
};
