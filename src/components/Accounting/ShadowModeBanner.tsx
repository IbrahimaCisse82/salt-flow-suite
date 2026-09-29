import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAccountingShadow } from "@/hooks/useAccountingShadow";

/** Bannière affichée sur les écrans comptables quand l'entreprise est en mode « en attente » (Lot 1.2). */
export const ShadowModeBanner = () => {
  const { mode, config, entries } = useAccountingShadow();
  if (!config || (mode !== "shadow" && entries.length === 0)) return null;
  return (
    <Alert className="border-primary">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
        <span>
          Vos écritures sont en attente de validation ({entries.length}). Les états financiers ne les incluent pas.
        </span>
        <Button asChild size="sm" variant="outline" className="min-h-11">
          <Link to="/comptabilite/grand-livre#ecritures-en-attente">Voir les écritures en attente</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
};
